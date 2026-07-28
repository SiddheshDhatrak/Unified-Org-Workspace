import { Request, Response, NextFunction } from 'express';
import { RateLimiterRedis, RateLimiterMemory } from 'rate-limiter-flexible';
import { redis } from '../config/redis';
import { env } from '../config/env';
import { RateLimitError } from '../shared/errors/AppError';

// Fallback to memory if in test mode or Redis is unreachable
const useRedis = env.NODE_ENV !== 'test';

export const globalRateLimiter = useRedis
  ? new RateLimiterRedis({
      storeClient: redis,
      keyPrefix: 'ratelimit:global',
      points: 100, // 100 requests
      duration: 60, // per 1 minute by IP
    })
  : new RateLimiterMemory({ points: 100, duration: 60 });

export const loginRateLimiter = useRedis
  ? new RateLimiterRedis({
      storeClient: redis,
      keyPrefix: 'ratelimit:login',
      points: 10, // 10 failed/login attempts
      duration: 900, // per 15 minutes per email+IP (§4.4)
    })
  : new RateLimiterMemory({ points: 10, duration: 900 });

export const heavyQueryRateLimiter = useRedis
  ? new RateLimiterRedis({
      storeClient: redis,
      keyPrefix: 'ratelimit:heavy',
      points: 5, // 5 requests
      duration: 60, // per 1 minute per user (§19.7)
    })
  : new RateLimiterMemory({ points: 5, duration: 60 });

export const rateLimitGlobal = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (env.NODE_ENV === 'test') return next();
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  try {
    await globalRateLimiter.consume(ip);
    next();
  } catch (rej) {
    next(new RateLimitError());
  }
};

export const rateLimitLogin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (env.NODE_ENV === 'test') return next();
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const email = req.body?.email || 'unknown_email';
  const key = `${email}:${ip}`;
  try {
    await loginRateLimiter.consume(key);
    next();
  } catch (rej) {
    next(new RateLimitError('Too many login attempts. Try again in 15 minutes.'));
  }
};

export const rateLimitHeavy = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (env.NODE_ENV === 'test') return next();
  const identifier = req.user?.id || req.ip || 'unknown';
  try {
    await heavyQueryRateLimiter.consume(identifier);
    next();
  } catch (rej) {
    next(new RateLimitError('Rate limit exceeded for intensive query/export operations.'));
  }
};
