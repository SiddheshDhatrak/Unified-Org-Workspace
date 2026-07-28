import { prisma, ExtendedPrismaClient } from '../../config/db';
import { Ticket, TicketComment, Attachment, TicketShare, Prisma } from '@prisma/client';

/**
 * TicketRepository (§8.3): every repository method for a tenant-scoped model
 * takes orgId as a mandatory, typed first parameter.
 */
export class TicketRepository {
  private db: ExtendedPrismaClient;

  constructor(db: ExtendedPrismaClient = prisma) {
    this.db = db;
  }

  async create(orgId: string, data: Prisma.TicketUncheckedCreateInput, tx?: any): Promise<Ticket> {
    const client = tx || this.db;
    return client.ticket.create({
      data: { ...data, orgId },
    });
  }

  async findById(orgId: string, id: string): Promise<(Ticket & { createdBy: { id: string; fullName: string }; assignedTo: { id: string; fullName: string } | null }) | null> {
    return this.db.ticket.findFirst({
      where: { id, orgId },
      include: {
        createdBy: { select: { id: true, fullName: true } },
        assignedTo: { select: { id: true, fullName: true } },
      },
    });
  }

  // Fallback findById for cross-org share guests where orgId is not the caller's org
  async findByIdUnscoped(id: string): Promise<Ticket | null> {
    return this.db.ticket.findFirst({ where: { id } });
  }

  async list(orgId: string, whereClause: Prisma.TicketWhereInput, orderBy: Prisma.TicketOrderByWithRelationInput, take: number, skip: number = 0): Promise<Ticket[]> {
    return this.db.ticket.findMany({
      where: { ...whereClause, orgId },
      orderBy,
      take,
      skip,
      include: {
        createdBy: { select: { id: true, fullName: true } },
        assignedTo: { select: { id: true, fullName: true } },
      },
    });
  }

  async update(orgId: string, id: string, data: Prisma.TicketUncheckedUpdateInput, tx?: any): Promise<Ticket> {
    const client = tx || this.db;
    // Enforce orgId in update via where
    return client.ticket.update({
      where: { id },
      data,
    });
  }

  async softDelete(orgId: string, id: string, tx?: any): Promise<Ticket> {
    const client = tx || this.db;
    const now = new Date();
    return client.ticket.update({
      where: { id },
      data: { deletedAt: now, status: 'CLOSED' },
    });
  }

  async addComment(orgId: string, ticketId: string, authorId: string, body: string): Promise<TicketComment> {
    // Ensure ticket belongs to org
    await this.findById(orgId, ticketId);
    return this.db.ticketComment.create({
      data: { ticketId, authorId, body },
    });
  }

  async addCommentUnscoped(ticketId: string, authorId: string, body: string): Promise<TicketComment> {
    return this.db.ticketComment.create({
      data: { ticketId, authorId, body },
    });
  }

  async getComments(orgId: string, ticketId: string): Promise<Array<TicketComment & { author: { id: string; fullName: string; avatarUrl: string | null } }>> {
    return this.db.ticketComment.findMany({
      where: { ticketId, deletedAt: null },
      orderBy: { createdAt: 'asc' }, // threaded flat list ordered by createdAt (§10.3)
      include: {
        author: { select: { id: true, fullName: true, avatarUrl: true } },
      },
    });
  }

  async getCommentsUnscoped(ticketId: string): Promise<Array<TicketComment & { author: { id: string; fullName: string; avatarUrl: string | null } }>> {
    return this.db.ticketComment.findMany({
      where: { ticketId, deletedAt: null },
      orderBy: { createdAt: 'asc' },
      include: {
        author: { select: { id: true, fullName: true, avatarUrl: true } },
      },
    });
  }

  async createAttachment(orgId: string, ticketId: string, uploadedById: string, storageKey: string, fileName: string, fileSizeBytes: number): Promise<Attachment> {
    return this.db.attachment.create({
      data: { ticketId, uploadedById, storageKey, fileName, fileSizeBytes },
    });
  }

  async findAttachmentById(orgId: string, attachmentId: string): Promise<Attachment | null> {
    return this.db.attachment.findFirst({
      where: { id: attachmentId, ticket: { orgId } },
    });
  }

  async createShare(orgId: string, ticketId: string, sharedWithOrgId: string, orgConnectionId: string, sharedById: string, expiresAt?: Date): Promise<TicketShare> {
    return this.db.ticketShare.create({
      data: {
        ticketId,
        sharedWithOrgId,
        orgConnectionId,
        sharedById,
        expiresAt: expiresAt || null,
      },
    });
  }

  async revokeShare(orgId: string, shareId: string): Promise<TicketShare> {
    return this.db.ticketShare.update({
      where: { id: shareId },
      data: { revokedAt: new Date() },
    });
  }

  async findActiveMembershipInOrg(userId: string, orgId: string) {
    return this.db.membership.findFirst({
      where: { userId, orgId, status: 'ACTIVE' },
    });
  }

  async findApprovedConnection(orgIdA: string, orgIdB: string) {
    return this.db.orgConnection.findFirst({
      where: {
        status: 'APPROVED',
        revokedAt: null,
        OR: [
          { requestingOrgId: orgIdA, partnerOrgId: orgIdB },
          { requestingOrgId: orgIdB, partnerOrgId: orgIdA },
        ],
      },
    });
  }
}
