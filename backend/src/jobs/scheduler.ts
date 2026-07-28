import { digestQueue } from './queues';
import { logger } from '../shared/logger';
import './workers/digest.worker';
import './workers/notification.worker';

export const setupScheduler = async () => {
  if (digestQueue) {
    try {
      // Repeat daily at 08:00 UTC (§15.1)
      await digestQueue.add('daily-ai-digest', {}, {
        repeat: { pattern: '0 8 * * *' },
      });
      logger.info('🕒 BullMQ Daily AI Digest job scheduled successfully.');
    } catch (err) {
      logger.warn({ err }, 'Could not register repeatable cron job in BullMQ');
    }
  }
};
