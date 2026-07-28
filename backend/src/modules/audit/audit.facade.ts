import { prisma } from '../../config/db';
import { logger } from '../../shared/logger';

export interface AuditRecordInput {
  orgId: string;
  actorId?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  beforeValue?: any;
  afterValue?: any;
  ip?: string;
  sessionId?: string;
}

export class AuditFacade {
  /**
   * ARCHITECTURAL DECISION (§14.2): Execute the audit INSERT inside the same
   * database transaction as the business mutation it records.
   */
  public static async record(input: AuditRecordInput, db: any = prisma): Promise<void> {
    try {
      await db.auditEvent.create({
        data: {
          orgId: input.orgId,
          actorId: input.actorId || null,
          action: input.action,
          resourceType: input.resourceType,
          resourceId: input.resourceId || null,
          beforeValue: input.beforeValue !== undefined ? input.beforeValue : null,
          afterValue: input.afterValue !== undefined ? input.afterValue : null,
          ip: input.ip || null,
          sessionId: input.sessionId || null,
        },
      });
    } catch (err: any) {
      logger.error({ err, auditInput: input }, '❌ Failed to insert append-only AuditEvent');
      throw err; // Re-throw to abort business transaction if inside one (§26 Edge Case 8)
    }
  }
}
