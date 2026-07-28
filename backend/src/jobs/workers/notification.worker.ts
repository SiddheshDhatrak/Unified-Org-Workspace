import { Worker } from 'bullmq';
import { env } from '../../config/env';
import { logger } from '../../shared/logger';
import { prisma } from '../../config/db';

export let notificationWorker: Worker | null = null;

if (env.NODE_ENV !== 'test') {
  try {
    notificationWorker = new Worker('notification-queue', async (job) => {
      const { userId, type, payload } = job.data;
      logger.debug({ jobId: job.id, userId, type }, 'Processing notification background delivery');
      await prisma.notification.create({
        data: {
          userId,
          type,
          payload,
          deliveredAt: new Date(),
        },
      });
    }, { connection: { url: env.REDIS_URL, maxRetriesPerRequest: null } as any });

    notificationWorker.on('failed', (job, err) => {
      logger.error({ jobId: job?.id, err }, 'Notification Worker job failed');
    });
  } catch (err) {
    logger.warn('⚠️ Notification Worker could not attach to Redis.');
  }
}
