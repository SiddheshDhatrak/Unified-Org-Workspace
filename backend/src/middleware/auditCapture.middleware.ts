import { Request, Response, NextFunction } from 'express';
import { AuditFacade } from '../modules/audit/audit.facade';

/**
 * Middleware for capturing HTTP-level audit trails or attaching audit helpers to request
 */
export const auditCaptureMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Attach helper method to req if needed by downstream non-transactional handlers
  // Main mutation auditing occurs in service layer inside transactions via AuditFacade.record()
  next();
};
