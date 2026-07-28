import { prisma } from '../../config/db';
import { logger } from '../../shared/logger';

export class NotificationFacade {
  /**
   * ARCHITECTURAL DECISION (§16.2): notifications can be queued or asynchronously created
   * so storage failure never fails the originating business operation.
   * Batching anti-spam (§16.3): collapses identical unread alerts within 60s window.
   */
  public static async notify(userId: string, type: string, payload: Record<string, any>): Promise<void> {
    try {
      const sixtySecondsAgo = new Date(Date.now() - 60 * 1000);
      const recentCount = await prisma.notification.count({
        where: {
          userId,
          type,
          read: false,
          createdAt: { gte: sixtySecondsAgo },
        },
      });

      if (recentCount >= 5) {
        // Anti-spam batching (§16.3): collapse spam into single grouped summary
        const existingBatch = await prisma.notification.findFirst({
          where: { userId, type: `${type}_BATCHED`, read: false },
        });
        if (existingBatch) return; // Already batched and unread
        await prisma.notification.create({
          data: {
            userId,
            type: `${type}_BATCHED`,
            payload: { message: `Multiple ${type} updates received in short succession` },
            deliveredAt: new Date(),
          },
        });
        return;
      }

      await prisma.notification.create({
        data: {
          userId,
          type,
          payload,
          deliveredAt: new Date(),
        },
      });
    } catch (err: any) {
      logger.warn({ err, userId, type }, '⚠️ Failed to persist Notification in background');
    }
  }
}
