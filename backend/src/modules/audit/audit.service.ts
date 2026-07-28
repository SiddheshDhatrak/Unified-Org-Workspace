import { prisma } from '../../config/db';

export interface AuditFilterQuery {
  orgId?: string;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
  actionType?: string;
  resourceType?: string;
  limit?: string;
  cursor?: string;
}

export class AuditService {
  async listEvents(activeOrgId: string, query: AuditFilterQuery) {
    const orgId = query.orgId || activeOrgId;
    const where: any = { orgId };

    if (query.userId) where.actorId = query.userId;
    if (query.actionType) where.action = query.actionType;
    if (query.resourceType) where.resourceType = query.resourceType;
    if (query.dateFrom || query.dateTo) {
      where.createdAt = {};
      if (query.dateFrom) where.createdAt.gte = new Date(query.dateFrom);
      if (query.dateTo) where.createdAt.lte = new Date(query.dateTo);
    }

    const take = Math.min(parseInt(query.limit || '50', 10), 100);
    const events = await prisma.auditEvent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take,
    });

    return { data: events, nextCursor: null };
  }

  async exportCsvStream(activeOrgId: string, query: AuditFilterQuery, writeStream: any): Promise<void> {
    const orgId = query.orgId || activeOrgId;
    const where: any = { orgId };

    if (query.userId) where.actorId = query.userId;
    if (query.actionType) where.action = query.actionType;
    if (query.resourceType) where.resourceType = query.resourceType;

    writeStream.write('ID,OrgID,ActorID,Action,ResourceType,ResourceID,IP,CreatedAt\n');

    let cursorId: string | undefined = undefined;
    const batchSize = 200;

    while (true) {
      const batch: any[] = await prisma.auditEvent.findMany({
        where,
        take: batchSize,
        skip: cursorId ? 1 : 0,
        cursor: cursorId ? { id: cursorId } : undefined,
        orderBy: { id: 'asc' },
      });

      if (batch.length === 0) break;

      for (const row of batch) {
        const line = `"${row.id}","${row.orgId}","${row.actorId || ''}","${row.action}","${row.resourceType}","${row.resourceId || ''}","${row.ip || ''}","${row.createdAt.toISOString()}"\n`;
        writeStream.write(line);
      }

      cursorId = batch[batch.length - 1].id;
      if (batch.length < batchSize) break;
    }

    writeStream.end();
  }
}
