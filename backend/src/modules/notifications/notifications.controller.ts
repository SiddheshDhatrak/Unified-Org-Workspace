import { Request, Response, NextFunction } from 'express';
import { NotificationService } from './notifications.service';

export class NotificationController {
  private service: NotificationService;

  constructor(service = new NotificationService()) {
    this.service = service;
  }

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.service.listNotifications(req.user!.id, req.query.read as string);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  markRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const item = await this.service.markAsRead(req.user!.id, req.params.id);
      res.status(200).json({ data: item });
    } catch (error) {
      next(error);
    }
  };

  markAllRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const resData = await this.service.markAllAsRead(req.user!.id);
      res.status(200).json({ data: resData });
    } catch (error) {
      next(error);
    }
  };
}
