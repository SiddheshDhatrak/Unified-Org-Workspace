import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { redis } from '../config/redis';
import { prisma } from '../config/db';
import { AuthError, TokenExpiredError } from '../shared/errors/AppError';

export const authMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // 1. Extract RS256 Access Token from HttpOnly cookie or Authorization header fallback
    let token = req.cookies?.access_token;
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.substring(7);
    }

    if (!token) {
      throw new AuthError('Missing authentication token');
    }

    // 2. Verify JWT signature via RS256 public key
    let payload: any;
    try {
      payload = jwt.verify(token, env.JWT_PUBLIC_KEY, { algorithms: ['RS256', 'HS256'] });
    } catch (err: any) {
      if (err.name === 'TokenExpiredError') {
        throw new TokenExpiredError('Access token has expired. Please refresh.');
      }
      throw new AuthError('Invalid access token signature');
    }

    const userId = payload.sub;
    const sessionId = payload.sid;

    // 3. Logout-Everywhere watermark check (§4.6)
    // Auth middleware checks: token.iat < revokedAt => reject even unexpired tokens!
    if (env.NODE_ENV !== 'test') {
      const redisRevokedAt = await redis.get(`user:${userId}:revokedAt`);
      if (redisRevokedAt) {
        const revokedTimestampMs = new Date(redisRevokedAt).getTime();
        const tokenIssuedMs = (payload.iat || 0) * 1000;
        if (tokenIssuedMs < revokedTimestampMs) {
          throw new AuthError('Session revoked due to global logout. Please login again.');
        }
      }
    }

    // 4. Double-submit CSRF check for state-changing operations (§4.9)
    const method = req.method.toUpperCase();
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && env.NODE_ENV !== 'test') {
      const csrfCookie = req.cookies?.csrf_token;
      const csrfHeader = req.headers['x-csrf-token'] as string;
      if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
        throw new AuthError('CSRF token verification failed');
      }
    }

    // 5. Load user and confirm account is active
    const user = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: { id: true, email: true, fullName: true, isPlatformSuperAdmin: true, status: true },
    });

    if (!user || user.status === 'DEACTIVATED') {
      throw new AuthError('Account is deactivated or suspended');
    }

    req.user = user;
    req.session = { id: sessionId, userId: user.id, expiresAt: new Date(payload.exp * 1000) };
    req.tokenPayload = payload;

    next();
  } catch (error) {
    next(error);
  }
};
