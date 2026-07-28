import crypto from 'crypto';
import { TicketStatus } from '@prisma/client';
import { prisma } from '../../config/db';
import { env } from '../../config/env';
import { TicketRepository } from './tickets.repository';
import { CreateTicketDTO, UpdateTicketDTO, AssignTicketDTO, CreateCommentDTO, UploadAttachmentDTO, ShareTicketDTO, TicketFilterQuery } from './tickets.types';
import { NotFoundError, InvalidStateTransitionError, StaleVersionError, ValidationError, PermissionDeniedError } from '../../shared/errors/AppError';
import { AuditFacade } from '../audit/audit.facade';
import { AUDIT_ACTIONS } from '../../shared/constants/audit.constants';
import { encodeCursor, decodeCursor, PaginatedResponse } from '../../shared/pagination/cursor';

/**
 * Ticket Lifecycle Allowed Transitions (§10.1 State Machine)
 */
const ALLOWED_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  [TicketStatus.OPEN]: [TicketStatus.IN_PROGRESS, TicketStatus.CLOSED],
  [TicketStatus.IN_PROGRESS]: [TicketStatus.BLOCKED, TicketStatus.RESOLVED, TicketStatus.CLOSED],
  [TicketStatus.BLOCKED]: [TicketStatus.IN_PROGRESS, TicketStatus.CLOSED],
  [TicketStatus.RESOLVED]: [TicketStatus.CLOSED, TicketStatus.IN_PROGRESS], // Reopened
  [TicketStatus.CLOSED]: [], // Terminal state
};

export class TicketService {
  private repo: TicketRepository;

  constructor(repo = new TicketRepository()) {
    this.repo = repo;
  }

  private validateStateTransition(from: TicketStatus, to: TicketStatus): void {
    if (from === to) return; // no status change
    const allowed = ALLOWED_TRANSITIONS[from] || [];
    if (!allowed.includes(to)) {
      throw new InvalidStateTransitionError(`Cannot transition ticket from ${from} to ${to}`);
    }
  }

  async create(orgId: string, actorId: string, dto: CreateTicketDTO, ip?: string, sessionId?: string) {
    if (dto.assignedToId) {
      const assigneeMember = await this.repo.findActiveMembershipInOrg(dto.assignedToId, orgId);
      if (!assigneeMember) {
        throw new ValidationError('Assignee must be an active member of the same organization (§10.8)');
      }
    }

    return prisma.$transaction(async (tx) => {
      const ticket = await this.repo.create(orgId, {
        orgId,
        createdById: actorId,
        title: dto.title,
        description: dto.description,
        priority: dto.priority || 'MEDIUM',
        status: 'OPEN',
        assignedToId: dto.assignedToId || null,
        version: 1,
      }, tx);

      await AuditFacade.record({
        orgId,
        actorId,
        action: AUDIT_ACTIONS.TICKET_CREATED,
        resourceType: 'TICKET',
        resourceId: ticket.id,
        afterValue: { title: ticket.title, priority: ticket.priority, assignedToId: ticket.assignedToId },
        ip,
        sessionId,
      }, tx);

      return ticket;
    });
  }

  async getById(orgId: string | undefined, ticketId: string, shareGrant?: any) {
    if (shareGrant && shareGrant.resourceId === ticketId) {
      const ticket = await this.repo.findByIdUnscoped(ticketId);
      if (!ticket) throw new NotFoundError('Ticket not found');
      return { ...ticket, _isReadOnlyGuestView: true };
    }

    if (!orgId) throw new NotFoundError('Ticket not found');
    const ticket = await this.repo.findById(orgId, ticketId);
    if (!ticket) throw new NotFoundError('Ticket not found');
    return ticket;
  }

  async list(orgId: string, query: TicketFilterQuery): Promise<PaginatedResponse<any>> {
    const limit = Math.min(parseInt(query.limit || '20', 10), 50);
    const where: any = {};

    if (query.status) where.status = query.status;
    if (query.priority) where.priority = query.priority;
    if (query.assignedToId) where.assignedToId = query.assignedToId;
    if (query.q) {
      where.OR = [
        { title: { contains: query.q, mode: 'insensitive' } },
        { description: { contains: query.q, mode: 'insensitive' } },
      ];
    }

    const sortBy = query.sortBy || 'createdAt';
    const sortDir = query.sortDir || 'desc';
    const orderBy: any = { [sortBy]: sortDir };

    const decoded = decodeCursor(query.cursor);
    if (decoded) {
      if (sortDir === 'desc') {
        where[sortBy] = { lte: sortBy === 'createdAt' || sortBy === 'updatedAt' ? new Date(decoded.sortValue) : decoded.sortValue };
        where.id = { ne: decoded.id };
      } else {
        where[sortBy] = { gte: sortBy === 'createdAt' || sortBy === 'updatedAt' ? new Date(decoded.sortValue) : decoded.sortValue };
        where.id = { ne: decoded.id };
      }
    }

    const rows = await this.repo.list(orgId, where, orderBy, limit + 1);
    let nextCursor: string | null = null;
    if (rows.length > limit) {
      const lastItem = rows[limit - 1];
      const sortVal = (lastItem as any)[sortBy];
      nextCursor = encodeCursor(sortVal, lastItem.id);
      rows.pop();
    }

    return { data: rows, nextCursor };
  }

  async update(orgId: string, ticketId: string, actorId: string, dto: UpdateTicketDTO, ip?: string, sessionId?: string) {
    const ticket = await this.getById(orgId, ticketId);

    // Optimistic Concurrency check (§26 Edge Case 2)
    if (ticket.version !== dto.expectedVersion) {
      throw new StaleVersionError('Concurrent edit collision detected. Stale version.', { currentTicket: ticket });
    }

    if (dto.status) {
      this.validateStateTransition(ticket.status, dto.status);
    }

    return prisma.$transaction(async (tx) => {
      const updateData: any = {
        version: ticket.version + 1,
      };
      if (dto.title !== undefined) updateData.title = dto.title;
      if (dto.description !== undefined) updateData.description = dto.description;
      if (dto.priority !== undefined) updateData.priority = dto.priority;
      if (dto.status !== undefined) updateData.status = dto.status;

      const updated = await this.repo.update(orgId, ticketId, updateData, tx);

      const action = dto.status !== undefined && dto.status !== ticket.status
        ? AUDIT_ACTIONS.TICKET_STATUS_CHANGED
        : AUDIT_ACTIONS.TICKET_UPDATED;

      await AuditFacade.record({
        orgId,
        actorId,
        action,
        resourceType: 'TICKET',
        resourceId: ticketId,
        beforeValue: { title: ticket.title, status: ticket.status, priority: ticket.priority },
        afterValue: { title: updated.title, status: updated.status, priority: updated.priority },
        ip,
        sessionId,
      }, tx);

      return updated;
    });
  }

  async assign(orgId: string, ticketId: string, actorId: string, dto: AssignTicketDTO, ip?: string, sessionId?: string) {
    const ticket = await this.getById(orgId, ticketId);
    if (ticket.version !== dto.expectedVersion) {
      throw new StaleVersionError('Concurrent edit collision detected during assignment.', { currentTicket: ticket });
    }

    if (dto.assignedToId) {
      const assigneeMember = await this.repo.findActiveMembershipInOrg(dto.assignedToId, orgId);
      if (!assigneeMember) {
        throw new ValidationError('Assignee must be an active member of the organization');
      }
    }

    return prisma.$transaction(async (tx) => {
      const updated = await this.repo.update(orgId, ticketId, {
        assignedToId: dto.assignedToId,
        version: ticket.version + 1,
      }, tx);

      await AuditFacade.record({
        orgId,
        actorId,
        action: AUDIT_ACTIONS.TICKET_ASSIGNED,
        resourceType: 'TICKET',
        resourceId: ticketId,
        beforeValue: { assignedToId: ticket.assignedToId },
        afterValue: { assignedToId: updated.assignedToId },
        ip,
        sessionId,
      }, tx);

      return updated;
    });
  }

  async softDelete(orgId: string, ticketId: string, actorId: string, ip?: string, sessionId?: string) {
    const ticket = await this.getById(orgId, ticketId);

    return prisma.$transaction(async (tx) => {
      const deleted = await this.repo.softDelete(orgId, ticketId, tx);

      await AuditFacade.record({
        orgId,
        actorId,
        action: AUDIT_ACTIONS.TICKET_DELETED,
        resourceType: 'TICKET',
        resourceId: ticketId,
        ip,
        sessionId,
      }, tx);

      return deleted;
    });
  }

  async addComment(orgId: string | undefined, ticketId: string, actorId: string, dto: CreateCommentDTO, shareGrant?: any, ip?: string, sessionId?: string) {
    let actualOrgId = orgId;
    if (shareGrant && shareGrant.resourceId === ticketId) {
      const ticket = await this.repo.findByIdUnscoped(ticketId);
      if (!ticket) throw new NotFoundError('Ticket not found');
      actualOrgId = ticket.orgId;
      const comment = await this.repo.addCommentUnscoped(ticketId, actorId, dto.body);
      await AuditFacade.record({
        orgId: actualOrgId!,
        actorId,
        action: AUDIT_ACTIONS.TICKET_COMMENT_ADDED,
        resourceType: 'TICKET_COMMENT',
        resourceId: comment.id,
        afterValue: { ticketId, body: dto.body },
        ip,
        sessionId,
      });
      return comment;
    }

    if (!orgId) throw new NotFoundError('Ticket not found');
    const comment = await this.repo.addComment(orgId, ticketId, actorId, dto.body);

    await AuditFacade.record({
      orgId,
      actorId,
      action: AUDIT_ACTIONS.TICKET_COMMENT_ADDED,
      resourceType: 'TICKET_COMMENT',
      resourceId: comment.id,
      afterValue: { ticketId, body: dto.body },
      ip,
      sessionId,
    });

    return comment;
  }

  async getComments(orgId: string | undefined, ticketId: string, shareGrant?: any) {
    if (shareGrant && shareGrant.resourceId === ticketId) {
      return this.repo.getCommentsUnscoped(ticketId);
    }
    if (!orgId) throw new NotFoundError('Ticket not found');
    return this.repo.getComments(orgId, ticketId);
  }

  async getSignedAttachmentUrl(orgId: string, attachmentId: string): Promise<string> {
    const attachment = await this.repo.findAttachmentById(orgId, attachmentId);
    if (!attachment) {
      throw new NotFoundError('Attachment not found');
    }
    // Stub signed URL flow (§10.3 / §24.7)
    const expires = Math.floor(Date.now() / 1000) + 300; // 5 min TTL
    const signature = crypto.createHmac('sha256', env.S3_SECRET_KEY || 'secret').update(`${attachment.storageKey}:${expires}`).digest('hex');
    return `https://${env.S3_BUCKET}.s3.${env.S3_REGION}.amazonaws.com/${attachment.storageKey}?expires=${expires}&signature=${signature}`;
  }

  async uploadAttachment(orgId: string, ticketId: string, actorId: string, dto: UploadAttachmentDTO, ip?: string, sessionId?: string) {
    await this.getById(orgId, ticketId);
    const storageKey = dto.storageKey || `tickets/${ticketId}/${crypto.randomUUID()}-${dto.fileName}`;
    const attachment = await this.repo.createAttachment(orgId, ticketId, actorId, storageKey, dto.fileName, dto.fileSizeBytes);

    await AuditFacade.record({
      orgId,
      actorId,
      action: AUDIT_ACTIONS.TICKET_ATTACHMENT_UPLOADED,
      resourceType: 'ATTACHMENT',
      resourceId: attachment.id,
      afterValue: { fileName: dto.fileName, size: dto.fileSizeBytes },
      ip,
      sessionId,
    });

    return attachment;
  }

  async shareTicket(orgId: string, ticketId: string, actorId: string, dto: ShareTicketDTO, ip?: string, sessionId?: string) {
    await this.getById(orgId, ticketId);
    const connection = await this.repo.findApprovedConnection(orgId, dto.partnerOrgId);
    if (!connection) {
      throw new PermissionDeniedError('An APPROVED OrgConnection is required before sharing resources with a partner organization (§13.3)');
    }

    const expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : undefined;
    const share = await this.repo.createShare(orgId, ticketId, dto.partnerOrgId, connection.id, actorId, expiresAt);

    await AuditFacade.record({
      orgId,
      actorId,
      action: AUDIT_ACTIONS.TICKET_SHARED,
      resourceType: 'TICKET_SHARE',
      resourceId: share.id,
      afterValue: { ticketId, partnerOrgId: dto.partnerOrgId, expiresAt },
      ip,
      sessionId,
    });

    return share;
  }

  async revokeShare(orgId: string, ticketId: string, shareId: string, actorId: string, ip?: string, sessionId?: string) {
    const share = await this.repo.revokeShare(orgId, shareId);

    await AuditFacade.record({
      orgId,
      actorId,
      action: AUDIT_ACTIONS.TICKET_SHARE_REVOKED,
      resourceType: 'TICKET_SHARE',
      resourceId: shareId,
      afterValue: { revokedAt: share.revokedAt },
      ip,
      sessionId,
    });

    return share;
  }
}
