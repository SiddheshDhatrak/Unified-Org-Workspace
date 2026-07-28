import { Request } from 'express';
import { OrgRole } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      id?: string;
      user?: {
        id: string;
        email: string;
        fullName: string;
        isPlatformSuperAdmin: boolean;
        status: string;
      };
      session?: {
        id: string;
        userId: string;
        expiresAt: Date;
      };
      orgContext?: {
        isSuperAdmin?: boolean;
        orgId?: string;
        membership?: {
          id: string;
          orgId: string;
          userId: string;
          orgRole: OrgRole;
          appRoles: Record<string, any>;
          status: string;
        };
        shareGrant?: {
          id: string;
          resourceType: 'TICKET' | 'PR';
          resourceId: string;
          sharedWithOrgId: string;
          canComment: boolean;
        };
      };
      tokenPayload?: {
        sub: string;
        sid: string;
        org?: string;
        roles?: string[];
        appRoles?: Record<string, any>;
        iat: number;
        exp: number;
      };
    }
  }
}
