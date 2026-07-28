import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { NotFoundError, PermissionDeniedError } from '../shared/errors/AppError';
import { MembershipStatus } from '@prisma/client';

/**
 * Tenant Scoping Middleware (§8.2, §10.10, §13.4)
 * Enforces strict org-level boundary from JWT token.org claim or cross-org share grants.
 */
export const tenantScopeMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      throw new PermissionDeniedError('Authentication required for tenant context resolution');
    }

    // Platform Super Admin bypasses normal tenant scoping when managing platform
    if (user.isPlatformSuperAdmin && req.headers['x-superadmin-override'] === 'true') {
      req.orgContext = { isSuperAdmin: true };
      return next();
    }

    const targetOrgId = req.tokenPayload?.org || (req.headers['x-org-id'] as string);

    if (!targetOrgId) {
      throw new PermissionDeniedError('No active organization context found in session');
    }

    // 1. Confirm req.user has an ACTIVE Membership in targetOrgId (§8.2 point 1)
    // We query DB live to catch user revocation mid-session within one request (§26 Edge Case 11)
    const membership = await prisma.membership.findFirst({
      where: {
        userId: user.id,
        orgId: targetOrgId,
        status: MembershipStatus.ACTIVE,
      },
    });

    if (membership) {
      req.orgContext = {
        orgId: membership.orgId,
        membership: {
          id: membership.id,
          orgId: membership.orgId,
          userId: membership.userId,
          orgRole: membership.orgRole,
          appRoles: (membership.appRoles as Record<string, any>) || {},
          status: membership.status,
        },
      };
      return next();
    }

    // 2. If no active membership in targetOrgId, check if this is a Cross-Org Share request (§8.2 point 3, §10.10, §13.4)
    // Extract resource type and id from route if it matches /tickets/:id or /prs/:id
    const ticketIdMatch = req.originalUrl.match(/\/tickets\/([a-zA-Z0-9-]+)/);
    const prIdMatch = req.originalUrl.match(/\/prs\/([a-zA-Z0-9-]+)/);

    const resourceId = ticketIdMatch ? ticketIdMatch[1] : prIdMatch ? prIdMatch[1] : null;
    const resourceType = ticketIdMatch ? 'TICKET' : prIdMatch ? 'PR' : null;

    if (resourceId && resourceType) {
      // Find all active orgs for the requesting user
      const userMemberships = await prisma.membership.findMany({
        where: { userId: user.id, status: MembershipStatus.ACTIVE },
        select: { orgId: true },
      });
      const userOrgIds = userMemberships.map((m) => m.orgId);

      if (userOrgIds.length > 0) {
        if (resourceType === 'TICKET') {
          const share = await prisma.ticketShare.findFirst({
            where: {
              ticketId: resourceId,
              sharedWithOrgId: { in: userOrgIds },
              revokedAt: null,
              OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
            },
          });
          if (share) {
            req.orgContext = {
              shareGrant: {
                id: share.id,
                resourceType: 'TICKET',
                resourceId: share.ticketId,
                sharedWithOrgId: share.sharedWithOrgId,
                canComment: true,
              },
            };
            return next();
          }
        } else if (resourceType === 'PR') {
          const share = await prisma.pRShare.findFirst({
            where: {
              prId: resourceId,
              sharedWithOrgId: { in: userOrgIds },
              revokedAt: null,
              OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
            },
          });
          if (share) {
            req.orgContext = {
              shareGrant: {
                id: share.id,
                resourceType: 'PR',
                resourceId: share.prId,
                sharedWithOrgId: share.sharedWithOrgId,
                canComment: true,
              },
            };
            return next();
          }
        }
      }
    }

    // 3. If neither active member nor valid cross-org share grant exists, return 404 not 403!
    // (§8.5, §26 Edge Case 5: 404-not-403 prevents resource existence leakage under IDOR/BOLA attempts)
    throw new NotFoundError('Resource or organization context not found');
  } catch (error) {
    next(error);
  }
};
