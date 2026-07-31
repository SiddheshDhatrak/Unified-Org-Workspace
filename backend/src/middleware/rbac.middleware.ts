import { Request, Response, NextFunction } from 'express';
import { PermissionDeniedError } from '../shared/errors/AppError';
import { OrgRole } from '@prisma/client';

export type PermissionAction =
  | 'ticket:create'
  | 'ticket:read'
  | 'ticket:update'
  | 'ticket:delete'
  | 'ticket:comment'
  | 'pr:create'
  | 'pr:read'
  | 'pr:review'
  | 'pr:comment'
  | 'audit:read'
  | 'audit:export'
  | 'org:manage'
  | 'crossorg:connect'
  | 'crossorg:share'
  | 'platform:manage';

/**
 * Resource & Action Permission Matrix (§7.3)
 */
export const PERMISSION_MATRIX: Record<PermissionAction, OrgRole[]> = {
  'ticket:create': [OrgRole.ORG_ADMIN, OrgRole.SUPPORT_AGENT, OrgRole.REVIEWER_APPROVER],
  'ticket:read': [OrgRole.ORG_ADMIN, OrgRole.SUPPORT_AGENT, OrgRole.REVIEWER_APPROVER],
  'ticket:update': [OrgRole.ORG_ADMIN, OrgRole.SUPPORT_AGENT],
  'ticket:delete': [OrgRole.ORG_ADMIN, OrgRole.SUPPORT_AGENT],
  'ticket:comment': [OrgRole.ORG_ADMIN, OrgRole.SUPPORT_AGENT, OrgRole.REVIEWER_APPROVER],
  'pr:create': [OrgRole.ORG_ADMIN, OrgRole.REVIEWER_APPROVER, OrgRole.SUPPORT_AGENT],
  'pr:read': [OrgRole.ORG_ADMIN, OrgRole.REVIEWER_APPROVER, OrgRole.SUPPORT_AGENT],
  'pr:review': [OrgRole.ORG_ADMIN, OrgRole.REVIEWER_APPROVER],
  'pr:comment': [OrgRole.ORG_ADMIN, OrgRole.REVIEWER_APPROVER],
  'audit:read': [OrgRole.ORG_ADMIN, OrgRole.REVIEWER_APPROVER],
  'audit:export': [OrgRole.ORG_ADMIN],
  'org:manage': [OrgRole.ORG_ADMIN],
  'crossorg:connect': [OrgRole.ORG_ADMIN],
  'crossorg:share': [OrgRole.ORG_ADMIN, OrgRole.SUPPORT_AGENT, OrgRole.REVIEWER_APPROVER],
  'platform:manage': [OrgRole.PLATFORM_SUPER_ADMIN],
};

/**
 * RBAC Factory Middleware (§7.4)
 */
export const rbac = (requiredPermission: PermissionAction) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const user = req.user;
      const ctx = req.orgContext;

      if (!user || !ctx) {
        throw new PermissionDeniedError('Missing user or tenant authorization context');
      }

      // Platform Super Admin global override
      if (user.isPlatformSuperAdmin) {
        return next();
      }

      if (requiredPermission === 'platform:manage' && !user.isPlatformSuperAdmin) {
        throw new PermissionDeniedError('Only PLATFORM_SUPER_ADMIN can execute platform management commands');
      }

      // Handle Cross-Org Guest via shareGrant (§13.4: view and comment only on shared item)
      if (ctx.shareGrant) {
        const allowedGuestPermissions: PermissionAction[] = ['ticket:read', 'ticket:comment', 'pr:read', 'pr:comment'];
        if (allowedGuestPermissions.includes(requiredPermission)) {
          return next();
        }
        throw new PermissionDeniedError('Cross-org guests only have read and comment permissions on explicitly shared resources.');
      }

      const membership = ctx.membership;
      if (!membership) {
        throw new PermissionDeniedError('Active membership required to access this resource');
      }

      const orgRole = membership.orgRole;
      const allowedRoles = PERMISSION_MATRIX[requiredPermission] || [];

      if (!allowedRoles.includes(orgRole)) {
        // Also check derived appRoles if applicable
        const appRoles = membership.appRoles;
        if (requiredPermission.startsWith('pr:') && appRoles.reviewConsole === 'REVIEWER') {
          return next();
        }
        if (requiredPermission.startsWith('ticket:') && appRoles.supportHub === 'ADMIN') {
          return next();
        }
        throw new PermissionDeniedError(`Role ${orgRole} lacks required permission ${requiredPermission}`);
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};
