import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const incomingId = req.headers['x-request-id'] as string;
  const requestId = incomingId || uuidv4();
  
  req.id = requestId;
  res.setHeader('X-Request-Id', requestId);
  req.headers['x-start-time'] = String(Date.now());
  
  next();
};
