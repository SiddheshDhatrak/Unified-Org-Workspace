import { Request, Response, NextFunction } from 'express';
import { AIDigestService } from './aiDigest.service';

export class AIDigestController {
  private service: AIDigestService;

  constructor(service = new AIDigestService()) {
    this.service = service;
  }

  getLatest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const digest = await this.service.getLatestDigest(req.user!.id, req.orgContext!.orgId!);
      res.status(200).json({ data: digest });
    } catch (error) {
      next(error);
    }
  };

  triggerGeneration = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const summary = await this.service.generateDigestForUser(req.user!.id, req.orgContext!.orgId!);
      res.status(200).json({ data: { summary } });
    } catch (error) {
      next(error);
    }
  };
}
