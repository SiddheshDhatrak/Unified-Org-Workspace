import { z } from 'zod';
import { ReviewDecision } from '@prisma/client';

export const createPRSchema = z.object({
  title: z.string().min(3, 'Title required'),
  description: z.string().min(1, 'Description required'),
  requiredApprovals: z.number().int().positive().optional(),
}).strict();

export const updatePRSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().min(1).optional(),
}).strict();

export const assignReviewerSchema = z.object({
  reviewerId: z.string().uuid(),
}).strict();

export const reviewPRSchema = z.object({
  decision: z.nativeEnum(ReviewDecision),
}).strict();

export const createPRCommentSchema = z.object({
  body: z.string().min(1),
  versionNumber: z.number().int().positive().optional(),
  threadId: z.string().optional(),
}).strict();

export const sharePRSchema = z.object({
  partnerOrgId: z.string().uuid(),
  expiresAt: z.string().datetime().nullable().optional(),
}).strict();
