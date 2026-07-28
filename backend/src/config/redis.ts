import Redis from 'ioredis';
import { env } from './env';

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null, // Needed for BullMQ compatibility
  lazyConnect: true,
  retryStrategy: (times) => {
    const delay = Math.min(times * 200, 5000);
    return delay;
  },
});

redis.on('error', (err) => {
  if (env.NODE_ENV !== 'test') {
    console.warn('⚠️ Redis error:', err.message);
  }
});

redis.on('connect', () => {
  if (env.NODE_ENV !== 'test') {
    console.log('🔌 Connected to Redis successfully.');
  }
});
