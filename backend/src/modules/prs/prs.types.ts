import { PRStatus, ReviewDecision } from '@prisma/client';

export interface CreatePRDTO {
  title: string;
  description: string;
  requiredApprovals?: number;
}

export interface UpdatePRDTO {
  title?: string;
  description?: string;
}

export interface AssignReviewerDTO {
  reviewerId: string;
}

export interface ReviewPRDTO {
  decision: ReviewDecision;
}

export interface CreatePRCommentDTO {
  body: string;
  versionNumber?: number;
  threadId?: string;
}

export interface SharePRDTO {
  partnerOrgId: string;
  expiresAt?: string | null;
}
