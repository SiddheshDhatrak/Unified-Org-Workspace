import { Request, Response, NextFunction } from 'express';
import { IdentityService } from './identity.service';
import { registerSchema, loginSchema, switchOrgSchema, acceptInviteSchema, updateProfileSchema } from './identity.dto';
import { validateInput } from '../../shared/validation/zod';
import { env } from '../../config/env';

export class IdentityController {
  private service: IdentityService;

  constructor(service = new IdentityService()) {
    this.service = service;
  }

  private setAuthCookies(res: Response, accessToken: string, refreshToken: string, csrfToken: string): void {
    const isProd = env.NODE_ENV === 'production';

    // Access Token HttpOnly cookie (§4.9: SameSite=Lax for navigation between app and review subdomains)
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: isProd,
      domain: isProd ? env.COOKIE_DOMAIN : undefined,
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000, // 15m
    });

    // Refresh Token HttpOnly cookie (§4.9: SameSite=Strict in prod, Lax in local dev for cross-port requests)
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: isProd,
      domain: isProd ? env.COOKIE_DOMAIN : undefined,
      sameSite: isProd ? 'strict' : 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30d
    });

    // Double-submit CSRF Token (Readable non-HttpOnly cookie for client echo, §4.9)
    res.cookie('csrf_token', csrfToken, {
      httpOnly: false,
      secure: isProd,
      domain: isProd ? env.COOKIE_DOMAIN : undefined,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
  }

  private clearAuthCookies(res: Response): void {
    const isProd = env.NODE_ENV === 'production';
    const domain = isProd ? env.COOKIE_DOMAIN : undefined;
    res.clearCookie('access_token', { domain });
    res.clearCookie('refresh_token', { domain });
    res.clearCookie('csrf_token', { domain });
  }

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = validateInput(registerSchema, req.body);
      const ip = req.ip || req.socket.remoteAddress;
      const result = await this.service.register(dto, ip, req.headers['user-agent']);

      this.setAuthCookies(res, result.tokens.accessToken, result.tokens.refreshToken, result.tokens.csrfToken);
      res.status(201).json({ data: result });
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = validateInput(loginSchema, req.body);
      const ip = req.ip || req.socket.remoteAddress;
      const result = await this.service.login(dto, ip, req.headers['user-agent']);

      this.setAuthCookies(res, result.tokens.accessToken, result.tokens.refreshToken, result.tokens.csrfToken);
      res.status(200).json({ data: result });
    } catch (error) {
      next(error);
    }
  };

  refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = req.cookies?.refresh_token || req.body?.refreshToken;
      const ip = req.ip || req.socket.remoteAddress;
      const tokens = await this.service.refreshTokens(token, ip);

      this.setAuthCookies(res, tokens.accessToken, tokens.refreshToken, tokens.csrfToken);
      res.status(200).json({ data: { tokens } });
    } catch (error) {
      this.clearAuthCookies(res);
      next(error);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (req.session && req.user) {
        await this.service.logout(req.session.id, req.user.id, req.orgContext?.orgId, req.ip);
      }
      this.clearAuthCookies(res);
      res.status(200).json({ data: { message: 'Logged out successfully' } });
    } catch (error) {
      next(error);
    }
  };

  logoutAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (req.user) {
        await this.service.logoutAll(req.user.id, req.orgContext?.orgId, req.ip, req.session?.id);
      }
      this.clearAuthCookies(res);
      res.status(200).json({ data: { message: 'Logged out from all devices successfully' } });
    } catch (error) {
      next(error);
    }
  };

  switchOrg = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = validateInput(switchOrgSchema, req.body);
      if (!req.user || !req.session) {
        throw new Error('Authentication required');
      }
      const result = await this.service.switchOrg(req.user.id, dto.organizationId, req.session.id, req.ip);

      // Re-set access token cookie with new org claim
      const isProd = env.NODE_ENV === 'production';
      res.cookie('access_token', result.accessToken, {
        httpOnly: true,
        secure: isProd,
        domain: isProd ? env.COOKIE_DOMAIN : undefined,
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000,
      });

      res.status(200).json({ data: { activeOrg: result.activeOrg, accessToken: result.accessToken } });
    } catch (error) {
      next(error);
    }
  };

  getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.status(200).json({
        data: {
          user: req.user,
          activeOrg: req.orgContext ? { orgId: req.orgContext.orgId, membership: req.orgContext.membership } : null,
        },
      });
    } catch (error) {
      next(error);
    }
  };
}
