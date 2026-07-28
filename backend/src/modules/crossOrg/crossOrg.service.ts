import { prisma } from '../../config/db';
import { RequestConnectionDTO } from './crossOrg.types';
import { NotFoundError, ConnectionAlreadyExistsError, PermissionDeniedError } from '../../shared/errors/AppError';
import { AuditFacade } from '../audit/audit.facade';
import { AUDIT_ACTIONS } from '../../shared/constants/audit.constants';

export class CrossOrgService {
  async requestConnection(orgId: string, actorId: string, dto: RequestConnectionDTO, ip?: string, sessionId?: string) {
    const partnerOrg = await prisma.organization.findUnique({ where: { slug: dto.partnerOrgSlug } });
    if (!partnerOrg || partnerOrg.status !== 'ACTIVE') {
      throw new NotFoundError('Partner organization not found or inactive');
    }
    if (partnerOrg.id === orgId) {
      throw new PermissionDeniedError('Cannot connect an organization to itself');
    }

    const existing = await prisma.orgConnection.findFirst({
      where: {
        OR: [
          { requestingOrgId: orgId, partnerOrgId: partnerOrg.id },
          { requestingOrgId: partnerOrg.id, partnerOrgId: orgId },
        ],
      },
    });
    if (existing) {
      throw new ConnectionAlreadyExistsError(`Connection request already exists with status ${existing.status} (§26.12)`, { status: existing.status });
    }

    const conn = await prisma.orgConnection.create({
      data: {
        requestingOrgId: orgId,
        partnerOrgId: partnerOrg.id,
        status: 'PENDING',
        requestedById: actorId,
      },
    });

    await AuditFacade.record({
      orgId,
      actorId,
      action: AUDIT_ACTIONS.ORG_CONNECTION_REQUESTED,
      resourceType: 'ORG_CONNECTION',
      resourceId: conn.id,
      afterValue: { partnerOrgId: partnerOrg.id, status: 'PENDING' },
      ip,
      sessionId,
    });

    return conn;
  }

  async listConnections(orgId: string) {
    return prisma.orgConnection.findMany({
      where: {
        OR: [{ requestingOrgId: orgId }, { partnerOrgId: orgId }],
      },
      include: {
        requestingOrg: { select: { id: true, name: true, slug: true } },
        partnerOrg: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approveConnection(orgId: string, connectionId: string, actorId: string, ip?: string, sessionId?: string) {
    const conn = await prisma.orgConnection.findUnique({ where: { id: connectionId } });
    if (!conn || conn.partnerOrgId !== orgId) {
      throw new NotFoundError('Connection request not found or only the partner organization can approve');
    }
    if (conn.status !== 'PENDING') {
      throw new PermissionDeniedError(`Connection status is ${conn.status}, only PENDING can be approved`);
    }

    const updated = await prisma.orgConnection.update({
      where: { id: connectionId },
      data: { status: 'APPROVED', respondedById: actorId, respondedAt: new Date() },
    });

    await AuditFacade.record({
      orgId,
      actorId,
      action: AUDIT_ACTIONS.ORG_CONNECTION_APPROVED,
      resourceType: 'ORG_CONNECTION',
      resourceId: connectionId,
      afterValue: { status: 'APPROVED' },
      ip,
      sessionId,
    });

    return updated;
  }

  async rejectConnection(orgId: string, connectionId: string, actorId: string, ip?: string, sessionId?: string) {
    const conn = await prisma.orgConnection.findUnique({ where: { id: connectionId } });
    if (!conn || conn.partnerOrgId !== orgId) {
      throw new NotFoundError('Connection request not found');
    }

    const updated = await prisma.orgConnection.update({
      where: { id: connectionId },
      data: { status: 'REJECTED', respondedById: actorId, respondedAt: new Date() },
    });

    await AuditFacade.record({
      orgId,
      actorId,
      action: AUDIT_ACTIONS.ORG_CONNECTION_REJECTED,
      resourceType: 'ORG_CONNECTION',
      resourceId: connectionId,
      afterValue: { status: 'REJECTED' },
      ip,
      sessionId,
    });

    return updated;
  }

  /**
   * Revoking connection immediately invalidates all active item-shares in the same transaction (§13.2)
   */
  async revokeConnection(orgId: string, connectionId: string, actorId: string, ip?: string, sessionId?: string) {
    const conn = await prisma.orgConnection.findUnique({ where: { id: connectionId } });
    if (!conn || (conn.requestingOrgId !== orgId && conn.partnerOrgId !== orgId)) {
      throw new NotFoundError('Connection not found in organization');
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.orgConnection.update({
        where: { id: connectionId },
        data: { status: 'REVOKED', revokedAt: new Date() },
      });

      // Cascade expiration of all active shared tickets & PRs under this connection! (§13.2)
      const now = new Date();
      await tx.ticketShare.updateMany({
        where: { orgConnectionId: connectionId, revokedAt: null },
        data: { revokedAt: now },
      });
      await tx.pRShare.updateMany({
        where: { orgConnectionId: connectionId, revokedAt: null },
        data: { revokedAt: now },
      });

      await AuditFacade.record({
        orgId,
        actorId,
        action: AUDIT_ACTIONS.ORG_CONNECTION_REVOKED,
        resourceType: 'ORG_CONNECTION',
        resourceId: connectionId,
        afterValue: { status: 'REVOKED', cascadeSharesRevoked: true },
        ip,
        sessionId,
      }, tx);

      return updated;
    });
  }
}
