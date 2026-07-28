import { Request, Response, NextFunction } from 'express';
import { FeatureFlagService } from './featureFlags.service';
import { z } from 'zod';
import { validateInput } from '../../shared/validation/zod';

const toggleFlagSchema = z.object({
  enabled: z.boolean(),
}).strict();

export class FeatureFlagController {
  private service: FeatureFlagService;

  constructor(service = new FeatureFlagService()) {
    this.service = service;
  }

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const flags = await this.service.listFlags(req.params.id);
      res.status(200).json({ data: flags });
    } catch (error) {
      next(error);
    }
  };

  toggle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = validateInput(toggleFlagSchema, req.body);
      const flag = await this.service.toggleFlag(
        req.params.id,
        req.params.key,
        dto.enabled,
        req.user!.id,
        req.ip,
        req.session?.id
      );
      res.status(200).json({ data: flag });
    } catch (error) {
      next(error);
    }
  };
}
