import { rbac } from '../../middleware/rbac.middleware';
import { PermissionDeniedError } from '../../shared/errors/AppError';
import { OrgRole } from '@prisma/client';

describe('RBAC Permission Matrix Enforcement (§8.2)', () => {
  const runMiddleware = async (req: any, perm: any) => {
    const middleware = rbac(perm);
    return new Promise((resolve, reject) => {
      middleware(req as any, {} as any, (err?: any) => {
        if (err) reject(err);
        else resolve(true);
      });
    });
  };

  test('Platform Super Admin overrides all permission requirements', async () => {
    const req = {
      user: { id: 'super', isPlatformSuperAdmin: true },
      orgContext: { orgId: 'org1', membership: { orgRole: OrgRole.SUPPORT_AGENT } },
    };
    await expect(runMiddleware(req, 'org:manage')).resolves.toBe(true);
  });

  test('Org Admin is granted admin permissions within organization', async () => {
    const req = {
      user: { id: 'admin1', isPlatformSuperAdmin: false },
      orgContext: { orgId: 'org1', membership: { orgRole: OrgRole.ORG_ADMIN } },
    };
    await expect(runMiddleware(req, 'org:manage')).resolves.toBe(true);
  });

  test('Support Agent role allowed ticket operations but denied PR merge and Org administration', async () => {
    const req = {
      user: { id: 'agent1', isPlatformSuperAdmin: false },
      orgContext: {
        orgId: 'org1',
        membership: { orgRole: OrgRole.SUPPORT_AGENT, appRoles: { support: ['SUPPORT_AGENT'] } },
      },
    };
    await expect(runMiddleware(req, 'ticket:create')).resolves.toBe(true);
    await expect(runMiddleware(req, 'org:manage')).rejects.toThrow(PermissionDeniedError);
  });
});
