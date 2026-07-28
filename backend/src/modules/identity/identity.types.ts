import { UserStatus, OrgRole } from '@prisma/client';

export interface RegisterDTO {
  email: string;
  password: string;
  fullName: string;
  organizationName?: string;
  invitationToken?: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface SwitchOrgDTO {
  organizationId: string;
}

export interface AcceptInviteDTO {
  invitationToken: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  csrfToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    fullName: string;
    avatarUrl?: string | null;
    status: UserStatus;
  };
  activeOrg?: {
    id: string;
    name: string;
    slug: string;
    role: OrgRole;
    appRoles: Record<string, any>;
  };
  availableOrgs: Array<{
    id: string;
    name: string;
    slug: string;
    role: OrgRole;
  }>;
  tokens: TokenPair;
}
