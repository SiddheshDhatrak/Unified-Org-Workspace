import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(10, 'Password must be at least 10 characters long (§4.1 policy)'),
  fullName: z.string().min(2, 'Full name must be provided'),
  organizationName: z.string().optional(),
  invitationToken: z.string().optional(),
}).strict().refine(data => data.organizationName || data.invitationToken, {
  message: 'Either organizationName (to create a new org) or invitationToken must be provided',
  path: ['organizationName'],
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
}).strict();

export const switchOrgSchema = z.object({
  organizationId: z.string().uuid('organizationId must be a valid UUID'),
}).strict();

export const acceptInviteSchema = z.object({
  invitationToken: z.string().min(1),
}).strict();

export const updateProfileSchema = z.object({
  fullName: z.string().min(2).optional(),
  avatarUrl: z.string().url().optional(),
}).strict();
