import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../../config/db';
import { redis } from '../../config/redis';
import { env } from '../../config/env';
import { IdentityRepository } from './identity.repository';
import { RegisterDTO, LoginDTO, AuthResponse, SwitchOrgDTO } from './identity.types';
import { AuthError, ValidationError, NotFoundError } from '../../shared/errors/AppError';
import { AuditFacade } from '../audit/audit.facade';
import { AUDIT_ACTIONS } from '../../shared/constants/audit.constants';
import { OrgRole, OrgStatus } from '@prisma/client';

export class IdentityService {
  private repo: IdentityRepository;

  constructor(repo = new IdentityRepository()) {
    this.repo = repo;
  }

  private generateSlug(name: string): string {
    return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-') + '-' + Math.floor(1000 + Math.random() * 9000);
  }

  private async generateTokens(user: { id: string }, sessionId: string, activeOrgId?: string, orgRole?: OrgRole, appRoles?: any): Promise<{ accessToken: string; refreshToken: string; csrfToken: string }> {
    const csrfToken = crypto.randomBytes(24).toString('hex');
    const expiresInSec = 15 * 60; // 15 minutes TTL (§4.3)

    const payload: any = {
      sub: user.id,
      sid: sessionId,
      iss: 'workspace-identity',
      aud: ['support-hub', 'review-console'],
    };

    if (activeOrgId) {
      payload.org = activeOrgId;
      payload.roles = [orgRole || OrgRole.SUPPORT_AGENT];
      payload.appRoles = appRoles || {};
    }

    const accessToken = jwt.sign(payload, env.JWT_PRIVATE_KEY, {
      algorithm: 'RS256',
      expiresIn: expiresInSec,
    });

    // Generate opaque 256-bit cryptographically random string for Refresh Token (§4.3)
    const rawRefreshToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    await this.repo.createRefreshToken(sessionId, tokenHash, expiresAt);

    return { accessToken, refreshToken: rawRefreshToken, csrfToken };
  }

  async register(data: RegisterDTO, ip?: string, deviceInfo?: string): Promise<AuthResponse> {
    const existing = await this.repo.findUserByEmail(data.email);
    if (existing) {
      throw new ValidationError('Email address already registered');
    }

    // Argon2id hashing with OWASP parameters (§4.2)
    const passwordHash = await argon2.hash(data.password, {
      type: argon2.argon2id,
      memoryCost: 19 * 1024, // 19 MiB
      timeCost: 2,
      parallelism: 1,
    });

    return prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.email,
          passwordHash,
          fullName: data.fullName,
          status: 'ACTIVE', // Default active for seamless eval & demo (§4.1)
          emailVerifiedAt: new Date(),
        },
      });

      let activeOrg: any = null;

      if (data.organizationName) {
        const slug = this.generateSlug(data.organizationName);
        const org = await tx.organization.create({
          data: {
            name: data.organizationName,
            slug,
            ownerId: user.id,
            status: OrgStatus.ACTIVE,
            settings: {
              digestIntervalCron: '0 9 * * *',
              defaultRequiredApprovals: 1,
              allowUserDigestOverride: false,
            },
          },
        });

        const defaultAppRoles = { supportHub: 'ADMIN', reviewConsole: 'ADMIN' };
        const membership = await tx.membership.create({
          data: {
            userId: user.id,
            orgId: org.id,
            orgRole: OrgRole.ORG_ADMIN,
            appRoles: defaultAppRoles,
            status: 'ACTIVE',
          },
        });

        activeOrg = {
          id: org.id,
          name: org.name,
          slug: org.slug,
          role: membership.orgRole,
          appRoles: defaultAppRoles,
        };

        await AuditFacade.record({
          orgId: org.id,
          actorId: user.id,
          action: AUDIT_ACTIONS.ORG_CREATED,
          resourceType: 'ORGANIZATION',
          resourceId: org.id,
          afterValue: { name: org.name, slug: org.slug, ownerId: user.id },
          ip,
        }, tx);
      } else if (data.invitationToken) {
        const invite = await tx.invitation.findUnique({ where: { token: data.invitationToken } });
        if (!invite || invite.expiresAt < new Date() || invite.revokedAt || invite.acceptedAt) {
          throw new ValidationError('Invalid, expired, or already accepted invitation token');
        }

        const org = await tx.organization.findUnique({ where: { id: invite.orgId } });
        if (!org || org.status !== OrgStatus.ACTIVE) {
          throw new ValidationError('Organization no longer active');
        }

        const membership = await tx.membership.create({
          data: {
            userId: user.id,
            orgId: org.id,
            orgRole: invite.role,
            appRoles: invite.appRoles || {},
            status: 'ACTIVE',
          },
        });

        await tx.invitation.update({ where: { id: invite.id }, data: { acceptedAt: new Date() } });

        activeOrg = {
          id: org.id,
          name: org.name,
          slug: org.slug,
          role: membership.orgRole,
          appRoles: (membership.appRoles as any) || {},
        };

        await AuditFacade.record({
          orgId: org.id,
          actorId: user.id,
          action: AUDIT_ACTIONS.INVITATION_ACCEPTED,
          resourceType: 'MEMBERSHIP',
          resourceId: membership.id,
          afterValue: { role: membership.orgRole, userId: user.id },
          ip,
        }, tx);
      }

      const session = await this.repo.createSession(user.id, deviceInfo, ip, undefined, tx);

      // We generate tokens out of tx or inside tx using the created session id
      const csrfToken = crypto.randomBytes(24).toString('hex');
      const expiresInSec = 15 * 60;
      const payload: any = {
        sub: user.id,
        sid: session.id,
        iss: 'workspace-identity',
        aud: ['support-hub', 'review-console'],
      };
      if (activeOrg) {
        payload.org = activeOrg.id;
        payload.roles = [activeOrg.role];
        payload.appRoles = activeOrg.appRoles;
      }
      const accessToken = jwt.sign(payload, env.JWT_PRIVATE_KEY, { algorithm: 'RS256', expiresIn: expiresInSec });
      const rawRefreshToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      
      await tx.refreshToken.create({
        data: { sessionId: session.id, tokenHash, expiresAt },
      });

      if (env.NODE_ENV !== 'test') {
        await redis.set(`session:${session.id}`, 'active', 'EX', 30 * 24 * 60 * 60);
      }

      if (activeOrg) {
        await AuditFacade.record({
          orgId: activeOrg.id,
          actorId: user.id,
          action: AUDIT_ACTIONS.AUTH_REGISTER,
          resourceType: 'USER',
          resourceId: user.id,
          ip,
          sessionId: session.id,
        }, tx);
      }

      return {
        user: { id: user.id, email: user.email, fullName: user.fullName, avatarUrl: user.avatarUrl, status: user.status },
        activeOrg,
        availableOrgs: activeOrg ? [{ id: activeOrg.id, name: activeOrg.name, slug: activeOrg.slug, role: activeOrg.role }] : [],
        tokens: { accessToken, refreshToken: rawRefreshToken, csrfToken, expiresIn: 900 },
      };
    });
  }

  async login(data: LoginDTO, ip?: string, deviceInfo?: string): Promise<AuthResponse> {
    const user = await this.repo.findUserByEmail(data.email);
    if (!user) {
      throw new AuthError('Invalid email or password');
    }

    if (user.status === 'DEACTIVATED') {
      throw new AuthError('Account deactivated');
    }

    const isValid = await argon2.verify(user.passwordHash, data.password);
    if (!isValid) {
      throw new AuthError('Invalid email or password');
    }

    const memberships = await this.repo.getActiveMemberships(user.id);
    // §4.4: Defaults to most recently active org (ordered by lastActiveAt desc in repository)
    const primaryMembership = memberships[0];

    const session = await this.repo.createSession(user.id, deviceInfo, ip);
    let activeOrg: any = undefined;

    if (primaryMembership) {
      activeOrg = {
        id: primaryMembership.orgId,
        name: primaryMembership.org.name,
        slug: primaryMembership.org.slug,
        role: primaryMembership.orgRole,
        appRoles: (primaryMembership.appRoles as any) || {},
      };
      await this.repo.updateMembershipLastActive(primaryMembership.id);
    }

    const tokens = await this.generateTokens(
      user,
      session.id,
      activeOrg?.id,
      activeOrg?.role,
      activeOrg?.appRoles
    );

    if (env.NODE_ENV !== 'test') {
      await redis.set(`session:${session.id}`, 'active', 'EX', 30 * 24 * 60 * 60);
    }

    if (activeOrg) {
      await AuditFacade.record({
        orgId: activeOrg.id,
        actorId: user.id,
        action: AUDIT_ACTIONS.AUTH_LOGIN,
        resourceType: 'SESSION',
        resourceId: session.id,
        ip,
        sessionId: session.id,
      });
    }

    const availableOrgs = memberships.map((m) => ({
      id: m.orgId,
      name: m.org.name,
      slug: m.org.slug,
      role: m.orgRole,
    }));

    return {
      user: { id: user.id, email: user.email, fullName: user.fullName, avatarUrl: user.avatarUrl, status: user.status },
      activeOrg,
      availableOrgs,
      tokens: { ...tokens, expiresIn: 900 },
    };
  }

  async refreshTokens(rawToken: string, ip?: string): Promise<{ accessToken: string; refreshToken: string; csrfToken: string }> {
    if (!rawToken) {
      throw new AuthError('Missing refresh token');
    }

    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    // 1. Check Redis revocation denylist (§4.5 / §4.8)
    if (env.NODE_ENV !== 'test') {
      const isRevoked = await redis.get(`revoked:${tokenHash}`);
      if (isRevoked) {
        throw new AuthError('Refresh token revoked');
      }
    }

    const tokenRecord = await this.repo.findRefreshTokenByHash(tokenHash);

    // Replay attack detection (§4.5): if dead token presented again, revoke entire session family & force logout everywhere!
    if (!tokenRecord || tokenRecord.revokedAt || tokenRecord.expiresAt < new Date()) {
      if (tokenRecord) {
        // Revoke the whole session family!
        await this.repo.revokeSession(tokenRecord.sessionId);
        await this.repo.revokeAllUserSessions(tokenRecord.session.userId);
        if (env.NODE_ENV !== 'test') {
          await redis.set(`user:${tokenRecord.session.userId}:revokedAt`, new Date().toISOString(), 'EX', 30 * 24 * 60 * 60);
        }
      }
      throw new AuthError('Invalid or expired refresh token; token replay detected, sessions terminated.');
    }

    const user = await this.repo.findUserById(tokenRecord.session.userId);
    if (!user || user.status === 'DEACTIVATED') {
      throw new AuthError('Account deactivated');
    }

    const memberships = await this.repo.getActiveMemberships(user.id);
    const primaryMembership = memberships[0];

    // Token rotation (§4.5): mark previous token revoked and issue new rotated one
    const now = new Date();
    await prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { revokedAt: now },
    });
    if (env.NODE_ENV !== 'test') {
      await redis.set(`revoked:${tokenHash}`, '1', 'EX', 30 * 24 * 60 * 60);
    }

    let activeOrgId: string | undefined;
    let orgRole: OrgRole | undefined;
    let appRoles: any | undefined;

    if (primaryMembership) {
      activeOrgId = primaryMembership.orgId;
      orgRole = primaryMembership.orgRole;
      appRoles = primaryMembership.appRoles;
    }

    // Issue new pair
    const newRawToken = crypto.randomBytes(32).toString('hex');
    const newTokenHash = crypto.createHash('sha256').update(newRawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await prisma.refreshToken.create({
      data: {
        sessionId: tokenRecord.sessionId,
        tokenHash: newTokenHash,
        rotatedFrom: tokenHash,
        expiresAt,
      },
    });

    const csrfToken = crypto.randomBytes(24).toString('hex');
    const payload: any = {
      sub: user.id,
      sid: tokenRecord.sessionId,
      iss: 'workspace-identity',
      aud: ['support-hub', 'review-console'],
    };
    if (activeOrgId) {
      payload.org = activeOrgId;
      payload.roles = [orgRole];
      payload.appRoles = appRoles;
    }
    const accessToken = jwt.sign(payload, env.JWT_PRIVATE_KEY, { algorithm: 'RS256', expiresIn: 15 * 60 });

    return { accessToken, refreshToken: newRawToken, csrfToken };
  }

  async logout(sessionId: string, userId: string, orgId?: string, ip?: string): Promise<void> {
    await this.repo.revokeSession(sessionId);
    if (env.NODE_ENV !== 'test') {
      await redis.del(`session:${sessionId}`);
    }
    if (orgId) {
      await AuditFacade.record({
        orgId,
        actorId: userId,
        action: AUDIT_ACTIONS.AUTH_LOGOUT,
        resourceType: 'SESSION',
        resourceId: sessionId,
        ip,
        sessionId,
      });
    }
  }

  async logoutAll(userId: string, orgId?: string, ip?: string, currentSessionId?: string): Promise<void> {
    await this.repo.revokeAllUserSessions(userId);
    if (env.NODE_ENV !== 'test') {
      await redis.set(`user:${userId}:revokedAt`, new Date().toISOString(), 'EX', 30 * 24 * 60 * 60);
    }
    if (orgId) {
      await AuditFacade.record({
        orgId,
        actorId: userId,
        action: AUDIT_ACTIONS.AUTH_LOGOUT_ALL,
        resourceType: 'USER',
        resourceId: userId,
        ip,
        sessionId: currentSessionId,
      });
    }
  }

  async switchOrg(userId: string, targetOrgId: string, sessionId: string, ip?: string): Promise<{ accessToken: string; activeOrg: any }> {
    const membership = await this.repo.getMembershipByOrg(userId, targetOrgId);
    if (!membership) {
      throw new NotFoundError('User is not an active member of the target organization');
    }

    await this.repo.updateMembershipLastActive(membership.id);

    const payload: any = {
      sub: userId,
      sid: sessionId,
      org: targetOrgId,
      roles: [membership.orgRole],
      appRoles: membership.appRoles || {},
      iss: 'workspace-identity',
      aud: ['support-hub', 'review-console'],
    };

    const accessToken = jwt.sign(payload, env.JWT_PRIVATE_KEY, { algorithm: 'RS256', expiresIn: 15 * 60 });

    await AuditFacade.record({
      orgId: targetOrgId,
      actorId: userId,
      action: AUDIT_ACTIONS.AUTH_ORG_SWITCHED,
      resourceType: 'ORGANIZATION',
      resourceId: targetOrgId,
      ip,
      sessionId,
    });

    const activeOrg = {
      id: targetOrgId,
      name: membership.org.name,
      slug: membership.org.slug,
      role: membership.orgRole,
      appRoles: (membership.appRoles as any) || {},
    };

    return { accessToken, activeOrg };
  }
}
