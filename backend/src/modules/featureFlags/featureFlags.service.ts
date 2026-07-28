import { prisma } from '../../config/db';
import { redis } from '../../config/redis';
import { env } from '../../config/env';
import { AuditFacade } from '../audit/audit.facade';
import { AUDIT_ACTIONS } from '../../shared/constants/audit.constants';

/**
 * Feature Flags Service (§17.2, §17.3)
 * Evaluation reads through a Redis cache (featureflags:{orgId}, 60s TTL) to avoid DB round-trips.
 * Write-through invalidates immediately on PATCH.
 */
export class FeatureFlagService {
  async listFlags(orgId: string) {
    const cacheKey = `featureflags:${orgId}`;
    if (env.NODE_ENV !== 'test') {
      const cached = await redis.get(cacheKey);
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch (e) {
          // Fall through to database
        }
      }
    }

    const flags = await prisma.featureFlag.findMany({ where: { orgId } });
    if (env.NODE_ENV !== 'test') {
      await redis.set(cacheKey, JSON.stringify(flags), 'EX', 60);
    }
    return flags;
  }

  async isEnabled(orgId: string, key: string): Promise<boolean> {
    const flags = await this.listFlags(orgId);
    const match = flags.find((f: any) => f.key === key);
    return match ? match.enabled : false;
  }

  async toggleFlag(orgId: string, key: string, enabled: boolean, actorId: string, ip?: string, sessionId?: string) {
    const existing = await prisma.featureFlag.findUnique({
      where: { orgId_key: { orgId, key } },
    });

    const flag = existing
      ? await prisma.featureFlag.update({
          where: { id: existing.id },
          data: { enabled },
        })
      : await prisma.featureFlag.create({
          data: { orgId, key, enabled },
        });

    // Immediate Redis cache invalidation (§17.3)
    if (env.NODE_ENV !== 'test') {
      await redis.del(`featureflags:${orgId}`);
    }

    await AuditFacade.record({
      orgId,
      actorId,
      action: AUDIT_ACTIONS.FLAG_TOGGLED,
      resourceType: 'FEATURE_FLAG',
      resourceId: flag.id,
      beforeValue: existing ? { enabled: existing.enabled } : null,
      afterValue: { key, enabled },
      ip,
      sessionId,
    });

    return flag;
  }
}
