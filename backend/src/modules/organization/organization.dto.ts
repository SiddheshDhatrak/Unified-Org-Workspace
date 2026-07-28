import { z } from 'zod';
import { OrgRole } from '@prisma/client';

export const createOrgSchema = z.object({
  name: z.string().min(2, 'Organization name is required'),
}).strict();

export const updateOrgSettingsSchema = z.object({
  settings: z.record(z.any()).optional(),
  planTier: z.enum(['free', 'standard']).optional(),
}).strict();

export const inviteUserSchema = z.object({
  email: z.string().email(),
  role: z.nativeEnum(OrgRole).default(OrgRole.SUPPORT_AGENT),
  appRoles: z.record(z.any()).optional(),
}).strict();

export const changeMemberRoleSchema = z.object({
  role: z.nativeEnum(OrgRole).optional(),
  appRoles: z.record(z.any()).optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'REMOVED']).optional(),
}).strict();
