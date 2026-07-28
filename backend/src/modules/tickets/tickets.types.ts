import { TicketStatus, TicketPriority } from '@prisma/client';

export interface CreateTicketDTO {
  title: string;
  description: string;
  priority?: TicketPriority;
  assignedToId?: string | null;
}

export interface UpdateTicketDTO {
  title?: string;
  description?: string;
  priority?: TicketPriority;
  status?: TicketStatus;
  expectedVersion: number;
}

export interface AssignTicketDTO {
  assignedToId: string | null;
  expectedVersion: number;
}

export interface CreateCommentDTO {
  body: string;
}

export interface UploadAttachmentDTO {
  fileName: string;
  fileSizeBytes: number;
  storageKey?: string;
}

export interface ShareTicketDTO {
  partnerOrgId: string;
  expiresAt?: string | null;
}

export interface TicketFilterQuery {
  status?: TicketStatus;
  priority?: TicketPriority;
  assignedToId?: string;
  q?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'priority' | 'title';
  sortDir?: 'asc' | 'desc';
  cursor?: string;
  limit?: string;
}
