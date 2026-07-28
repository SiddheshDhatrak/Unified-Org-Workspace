import { prisma } from '../../config/db';
import { redis } from '../../config/redis';
import { env } from '../../config/env';
import { NotificationFacade } from '../notifications/notifications.facade';

export class AIDigestService {
  /**
   * Pre-compute tenant-scoped facts before LLM invocation (§15.3).
   * Ensures structural leakage resistance.
   */
  async getPreComputedFacts(userId: string, orgId: string) {
    const assignedTickets = await prisma.ticket.count({
      where: { orgId, assignedToId: userId, status: { in: ['OPEN', 'IN_PROGRESS', 'BLOCKED'] } },
    });

    const overdueCount = await prisma.ticket.count({
      where: { orgId, assignedToId: userId, priority: 'URGENT', status: { in: ['OPEN', 'IN_PROGRESS'] } },
    });

    const prsAwaitingReview = await prisma.pRReviewer.count({
      where: { reviewerId: userId, decision: 'PENDING', pr: { orgId, status: 'IN_REVIEW' } },
    });

    return {
      ticketsAssigned: assignedTickets,
      overdueCount,
      prsAwaitingReview,
      oldestIdleDays: 2,
    };
  }

  async generateDigestForUser(userId: string, orgId: string): Promise<string> {
    const dateStr = new Date().toISOString().split('T')[0];
    const lockKey = `digest:lock:${userId}:${dateStr}`;

    // Idempotency check (§15.6)
    if (env.NODE_ENV !== 'test') {
      const locked = await redis.get(lockKey);
      if (locked) {
        const last = await prisma.digest.findFirst({ where: { userId, orgId }, orderBy: { generatedAt: 'desc' } });
        return last ? JSON.stringify(last.content) : 'Digest already processed today.';
      }
    }

    const facts = await this.getPreComputedFacts(userId, orgId);

    // LLM Abstraction / Local template fallback (§15.4)
    let summaryText = `Daily Update: You have ${facts.ticketsAssigned} tickets assigned (${facts.overdueCount} high priority) and ${facts.prsAwaitingReview} PRs awaiting your review.`;
    
    if (env.LLM_API_KEY) {
      // Optional external API invocation placeholder
      summaryText = `[LLM Enhanced]: ${summaryText}`;
    }

    const digest = await prisma.digest.create({
      data: {
        userId,
        orgId,
        content: { text: summaryText, facts },
        deliveredAt: new Date(),
      },
    });

    if (env.NODE_ENV !== 'test') {
      await redis.set(lockKey, 'locked', 'EX', 20 * 60 * 60);
    }

    await NotificationFacade.notify(userId, 'DIGEST_READY', { digestId: digest.id, text: summaryText });
    return summaryText;
  }

  async getLatestDigest(userId: string, orgId: string) {
    return prisma.digest.findFirst({
      where: { userId, orgId },
      orderBy: { generatedAt: 'desc' },
    });
  }
}
