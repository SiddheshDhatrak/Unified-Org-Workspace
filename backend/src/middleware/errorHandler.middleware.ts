import { Request, Response, NextFunction } from 'express';
import { AppError } from '../shared/errors/AppError';
import { logger } from '../shared/logger';
import { env } from '../config/env';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const requestId = req.id || 'unknown-req';
  const durationMs = req.headers['x-start-time']
    ? Date.now() - parseInt(req.headers['x-start-time'] as string, 10)
    : 0;

  if (err instanceof AppError) {
    logger.warn({
      requestId,
      userId: req.user?.id,
      orgId: req.orgContext?.orgId,
      route: req.originalUrl,
      method: req.method,
      durationMs,
      errorCode: err.code,
      message: err.message,
    }, `Request failed with domain AppError: ${err.code}`);

    res.status(err.statusCode).json(err.toResponse());
    return;
  }

  // Unhandled / Unexpected internal server errors
  logger.error({
    requestId,
    userId: req.user?.id,
    orgId: req.orgContext?.orgId,
    route: req.originalUrl,
    method: req.method,
    durationMs,
    err: env.NODE_ENV === 'production' ? { message: err.message } : err,
  }, 'Unhandled Internal Server Error');

  if (env.NODE_ENV === 'production') {
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An internal server error occurred',
      },
    });
  } else {
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: err.message || 'An internal server error occurred',
        details: err.stack,
      },
    });
  }
};
