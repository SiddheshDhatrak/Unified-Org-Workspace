import { Request, Response, NextFunction } from 'express';
import { PRService } from './prs.service';
import { createPRSchema, updatePRSchema, assignReviewerSchema, reviewPRSchema, createPRCommentSchema, sharePRSchema } from './prs.dto';
import { validateInput } from '../../shared/validation/zod';

export class PRController {
  private service: PRService;

  constructor(service = new PRService()) {
    this.service = service;
  }

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = validateInput(createPRSchema, req.body);
      const pr = await this.service.create(req.orgContext!.orgId!, req.user!.id, dto, req.ip, req.session?.id);
      res.status(201).json({ data: pr });
    } catch (error) {
      next(error);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const prs = await this.service.list(req.orgContext!.orgId!);
      res.status(200).json({ data: prs });
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const pr = await this.service.getById(req.orgContext?.orgId, req.params.id, req.orgContext?.shareGrant);
      res.status(200).json({ data: pr });
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = validateInput(updatePRSchema, req.body);
      const pr = await this.service.update(req.orgContext!.orgId!, req.params.id, req.user!.id, dto, req.ip, req.session?.id);
      res.status(200).json({ data: pr });
    } catch (error) {
      next(error);
    }
  };

  submit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const pr = await this.service.submit(req.orgContext!.orgId!, req.params.id, req.user!.id, req.ip, req.session?.id);
      res.status(200).json({ data: pr });
    } catch (error) {
      next(error);
    }
  };

  assignReviewer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = validateInput(assignReviewerSchema, req.body);
      const reviewer = await this.service.assignReviewer(req.orgContext!.orgId!, req.params.id, req.user!.id, dto, req.ip, req.session?.id);
      res.status(200).json({ data: reviewer });
    } catch (error) {
      next(error);
    }
  };

  review = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = validateInput(reviewPRSchema, req.body);
      const result = await this.service.review(req.orgContext!.orgId!, req.params.id, req.user!.id, dto, req.ip, req.session?.id);
      res.status(200).json({ data: result });
    } catch (error) {
      next(error);
    }
  };

  merge = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const pr = await this.service.merge(req.orgContext!.orgId!, req.params.id, req.user!.id, req.ip, req.session?.id);
      res.status(200).json({ data: pr });
    } catch (error) {
      next(error);
    }
  };

  listVersions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const versions = await this.service.listVersions(req.orgContext!.orgId!, req.params.id);
      res.status(200).json({ data: versions });
    } catch (error) {
      next(error);
    }
  };

  getVersion = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const version = await this.service.getVersion(req.orgContext!.orgId!, req.params.id, parseInt(req.params.n, 10));
      res.status(200).json({ data: version });
    } catch (error) {
      next(error);
    }
  };

  getDiff = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const diff = await this.service.getDiff(req.orgContext!.orgId!, req.params.id, parseInt(req.params.n, 10));
      res.status(200).json({ data: { diff } });
    } catch (error) {
      next(error);
    }
  };

  restore = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const verNum = parseInt(req.params.n || req.body.versionNumber, 10);
      const restored = await this.service.rollbackVersion(req.orgContext!.orgId!, req.params.id, verNum, req.user!.id, req.ip, req.session?.id);
      res.status(200).json({ data: restored });
    } catch (error) {
      next(error);
    }
  };

  addComment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = validateInput(createPRCommentSchema, req.body);
      const comment = await this.service.addComment(req.orgContext?.orgId, req.params.id, req.user!.id, dto, req.orgContext?.shareGrant);
      res.status(201).json({ data: comment });
    } catch (error) {
      next(error);
    }
  };

  listComments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const comments = await this.service.listComments(req.orgContext?.orgId, req.params.id, req.orgContext?.shareGrant);
      res.status(200).json({ data: comments });
    } catch (error) {
      next(error);
    }
  };

  share = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = validateInput(sharePRSchema, req.body);
      const share = await this.service.share(req.orgContext!.orgId!, req.params.id, req.user!.id, dto, req.ip, req.session?.id);
      res.status(201).json({ data: share });
    } catch (error) {
      next(error);
    }
  };
}
