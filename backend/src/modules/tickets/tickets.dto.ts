import { z } from 'zod';
import { TicketStatus, TicketPriority } from '@prisma/client';

export const createTicketSchema = z.object({
  title: z.string().min(3, 'Title is required and must be at least 3 characters'),
  description: z.string().min(1, 'Description is required'),
  priority: z.nativeEnum(TicketPriority).default(TicketPriority.MEDIUM),
  assignedToId: z.string().uuid().nullable().optional(),
}).strict();

export const updateTicketSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().min(1).optional(),
  priority: z.nativeEnum(TicketPriority).optional(),
  status: z.nativeEnum(TicketStatus).optional(),
  expectedVersion: z.number().int().positive('expectedVersion is mandatory for optimistic concurrency (§26.2)'),
}).strict();

export const assignTicketSchema = z.object({
  assignedToId: z.string().uuid().nullable(),
  expectedVersion: z.number().int().positive(),
}).strict();

export const createCommentSchema = z.object({
  body: z.string().min(1, 'Comment body cannot be empty'),
}).strict();

export const uploadAttachmentSchema = z.object({
  fileName: z.string().min(1),
  fileSizeBytes: z.number().int().positive(),
  storageKey: z.string().optional(),
}).strict();

export const shareTicketSchema = z.object({
  partnerOrgId: z.string().uuid(),
  expiresAt: z.string().datetime().nullable().optional(),
}).strict();
