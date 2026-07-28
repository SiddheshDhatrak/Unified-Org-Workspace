import { Queue } from 'bullmq';
import { env } from '../config/env';
import { logger } from '../shared/logger';

// Gracefully instantiate queues only in non-test or when redis is available
export let digestQueue: Queue | null = null;
export let notificationQueue: Queue | null = null;

try {
  if (env.NODE_ENV !== 'test') {
    const redisOpts = { connection: { url: env.REDIS_URL, maxRetriesPerRequest: null } };
    digestQueue = new Queue('digest-queue', redisOpts as any);
    notificationQueue = new Queue('notification-queue', redisOpts as any);
  }
} catch (err) {
  logger.warn('⚠️ BullMQ Queues failed to connect to Redis; continuing without background job queueing.');
}
