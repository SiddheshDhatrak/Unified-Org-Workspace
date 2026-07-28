import { Worker } from 'bullmq';
import { env } from '../../config/env';
import { logger } from '../../shared/logger';
import { prisma } from '../../config/db';
import { AIDigestService } from '../../modules/aiDigest/aiDigest.service';

export let digestWorker: Worker | null = null;

if (env.NODE_ENV !== 'test') {
  try {
    const digestService = new AIDigestService();
    digestWorker = new Worker('digest-queue', async (job) => {
      logger.info({ jobId: job.id }, 'Processing daily AI Digest generation job');
      const orgs = await prisma.organization.findMany({ where: { status: 'ACTIVE' } });
      
      for (const org of orgs) {
        const members = await prisma.membership.findMany({ where: { orgId: org.id, status: 'ACTIVE' } });
        for (const member of members) {
          try {
            await digestService.generateDigestForUser(member.userId, org.id);
          } catch (err) {
            logger.error({ err, userId: member.userId, orgId: org.id }, 'Failed to generate digest for member');
          }
        }
      }
    }, { connection: { url: env.REDIS_URL, maxRetriesPerRequest: null } as any });
    
    digestWorker.on('failed', (job, err) => {
      logger.error({ jobId: job?.id, err }, 'Digest Worker job failed');
    });
  } catch (err) {
    logger.warn('⚠️ Digest Worker could not attach to Redis.');
  }
}
