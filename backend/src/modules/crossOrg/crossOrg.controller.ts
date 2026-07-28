import { Request, Response, NextFunction } from 'express';
import { CrossOrgService } from './crossOrg.service';
import { requestConnectionSchema } from './crossOrg.dto';
import { validateInput } from '../../shared/validation/zod';

export class CrossOrgController {
  private service: CrossOrgService;

  constructor(service = new CrossOrgService()) {
    this.service = service;
  }

  requestConnection = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = validateInput(requestConnectionSchema, req.body);
      const conn = await this.service.requestConnection(req.orgContext!.orgId!, req.user!.id, dto, req.ip, req.session?.id);
      res.status(201).json({ data: conn });
    } catch (error) {
      next(error);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const conns = await this.service.listConnections(req.orgContext!.orgId!);
      res.status(200).json({ data: conns });
    } catch (error) {
      next(error);
    }
  };

  approve = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const conn = await this.service.approveConnection(req.orgContext!.orgId!, req.params.id, req.user!.id, req.ip, req.session?.id);
      res.status(200).json({ data: conn });
    } catch (error) {
      next(error);
    }
  };

  reject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const conn = await this.service.rejectConnection(req.orgContext!.orgId!, req.params.id, req.user!.id, req.ip, req.session?.id);
      res.status(200).json({ data: conn });
    } catch (error) {
      next(error);
    }
  };

  revoke = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const conn = await this.service.revokeConnection(req.orgContext!.orgId!, req.params.id, req.user!.id, req.ip, req.session?.id);
      res.status(200).json({ data: conn });
    } catch (error) {
      next(error);
    }
  };
}
