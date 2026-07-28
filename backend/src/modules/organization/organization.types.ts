import { OrgRole, OrgStatus } from '@prisma/client';

export interface CreateOrgDTO {
  name: string;
}

export interface UpdateOrgSettingsDTO {
  settings?: Record<string, any>;
  planTier?: string;
}

export interface InviteUserDTO {
  email: string;
  role?: OrgRole;
  appRoles?: Record<string, any>;
}

export interface ChangeMemberRoleDTO {
  role?: OrgRole;
  appRoles?: Record<string, any>;
  status?: 'ACTIVE' | 'SUSPENDED' | 'REMOVED';
}
