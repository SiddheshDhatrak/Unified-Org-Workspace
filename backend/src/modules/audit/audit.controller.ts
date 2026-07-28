import { Request, Response, NextFunction } from 'express';
import { AuditService } from './audit.service';

export class AuditController {
  private service: AuditService;

  constructor(service = new AuditService()) {
    this.service = service;
  }

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.service.listEvents(req.orgContext!.orgId!, req.query as any);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  export = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const format = (req.query.format as string) || 'csv';
      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="audit-export-${Date.now()}.csv"`);
        await this.service.exportCsvStream(req.orgContext!.orgId!, req.query as any, res);
      } else {
        res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Only CSV format supported' } });
      }
    } catch (error) {
      next(error);
    }
  };
}
