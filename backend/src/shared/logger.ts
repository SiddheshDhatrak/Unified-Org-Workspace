import pino from 'pino';
import { env } from '../config/env';

export const logger = pino({
  level: env.NODE_ENV === 'test' ? 'silent' : 'info',
  transport: env.NODE_ENV === 'development'
    ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:standard' } }
    : undefined,
  redact: {
    paths: [
      'password',
      'passwordHash',
      'token',
      'refreshToken',
      'tokenHash',
      'authorization',
      'cookie',
      'req.headers.cookie',
      'req.headers.authorization',
    ],
    censor: '[REDACTED]',
  },
  base: {
    env: env.NODE_ENV,
  },
  formatters: {
    level: (label) => ({ level: label }),
  },
});
