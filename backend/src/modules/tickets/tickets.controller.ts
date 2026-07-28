import { Request, Response, NextFunction } from 'express';
import { TicketService } from './tickets.service';
import { createTicketSchema, updateTicketSchema, assignTicketSchema, createCommentSchema, uploadAttachmentSchema, shareTicketSchema } from './tickets.dto';
import { validateInput } from '../../shared/validation/zod';

export class TicketController {
  private service: TicketService;

  constructor(service = new TicketService()) {
    this.service = service;
  }

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = validateInput(createTicketSchema, req.body);
      const ticket = await this.service.create(
        req.orgContext!.orgId!,
        req.user!.id,
        dto,
        req.ip,
        req.session?.id
      );
      res.status(201).json({ data: ticket });
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ticket = await this.service.getById(
        req.orgContext?.orgId,
        req.params.id,
        req.orgContext?.shareGrant
      );
      res.status(200).json({ data: ticket });
    } catch (error) {
      next(error);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.service.list(req.orgContext!.orgId!, req.query as any);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = validateInput(updateTicketSchema, req.body);
      const ticket = await this.service.update(
        req.orgContext!.orgId!,
        req.params.id,
        req.user!.id,
        dto,
        req.ip,
        req.session?.id
      );
      res.status(200).json({ data: ticket });
    } catch (error) {
      next(error);
    }
  };

  assign = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = validateInput(assignTicketSchema, req.body);
      const ticket = await this.service.assign(
        req.orgContext!.orgId!,
        req.params.id,
        req.user!.id,
        dto,
        req.ip,
        req.session?.id
      );
      res.status(200).json({ data: ticket });
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ticket = await this.service.softDelete(
        req.orgContext!.orgId!,
        req.params.id,
        req.user!.id,
        req.ip,
        req.session?.id
      );
      res.status(200).json({ data: ticket });
    } catch (error) {
      next(error);
    }
  };

  addComment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = validateInput(createCommentSchema, req.body);
      const comment = await this.service.addComment(
        req.orgContext?.orgId,
        req.params.id,
        req.user!.id,
        dto,
        req.orgContext?.shareGrant,
        req.ip,
        req.session?.id
      );
      res.status(201).json({ data: comment });
    } catch (error) {
      next(error);
    }
  };

  listComments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const comments = await this.service.getComments(
        req.orgContext?.orgId,
        req.params.id,
        req.orgContext?.shareGrant
      );
      res.status(200).json({ data: comments });
    } catch (error) {
      next(error);
    }
  };

  uploadAttachment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = validateInput(uploadAttachmentSchema, req.body);
      const attachment = await this.service.uploadAttachment(
        req.orgContext!.orgId!,
        req.params.id,
        req.user!.id,
        dto,
        req.ip,
        req.session?.id
      );
      res.status(201).json({ data: attachment });
    } catch (error) {
      next(error);
    }
  };

  getAttachmentUrl = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const url = await this.service.getSignedAttachmentUrl(req.orgContext!.orgId!, req.params.attId);
      res.status(200).json({ data: { signedUrl: url } });
    } catch (error) {
      next(error);
    }
  };

  share = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = validateInput(shareTicketSchema, req.body);
      const share = await this.service.shareTicket(
        req.orgContext!.orgId!,
        req.params.id,
        req.user!.id,
        dto,
        req.ip,
        req.session?.id
      );
      res.status(201).json({ data: share });
    } catch (error) {
      next(error);
    }
  };

  revokeShare = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const share = await this.service.revokeShare(
        req.orgContext!.orgId!,
        req.params.id,
        req.params.shareId,
        req.user!.id,
        req.ip,
        req.session?.id
      );
      res.status(200).json({ data: share });
    } catch (error) {
      next(error);
    }
  };
}
