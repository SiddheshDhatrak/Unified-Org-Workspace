import { Request, Response, NextFunction } from 'express';
import { OrganizationService } from './organization.service';
import { updateOrgSettingsSchema, inviteUserSchema, changeMemberRoleSchema } from './organization.dto';
import { validateInput } from '../../shared/validation/zod';

export class OrganizationController {
  private service: OrganizationService;

  constructor(service = new OrganizationService()) {
    this.service = service;
  }

  getDetail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const org = await this.service.getOrgDetail(req.params.id);
      res.status(200).json({ data: org });
    } catch (error) {
      next(error);
    }
  };

  updateSettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = validateInput(updateOrgSettingsSchema, req.body);
      const org = await this.service.updateSettings(
        req.params.id,
        dto,
        req.user!.id,
        req.ip,
        req.session?.id
      );
      res.status(200).json({ data: org });
    } catch (error) {
      next(error);
    }
  };

  archive = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const org = await this.service.archiveOrg(req.params.id, req.user!.id, req.ip, req.session?.id);
      res.status(200).json({ data: org });
    } catch (error) {
      next(error);
    }
  };

  restore = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const org = await this.service.restoreOrg(req.params.id, req.user!.id, req.ip, req.session?.id);
      res.status(200).json({ data: org });
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const org = await this.service.deleteOrg(req.params.id, req.user!.id, req.ip, req.session?.id);
      res.status(200).json({ data: org });
    } catch (error) {
      next(error);
    }
  };

  listMembers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const members = await this.service.listMembers(req.params.id);
      res.status(200).json({ data: members });
    } catch (error) {
      next(error);
    }
  };

  invite = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = validateInput(inviteUserSchema, req.body);
      const invite = await this.service.inviteMember(req.params.id, dto, req.user!.id, req.ip, req.session?.id);
      res.status(201).json({ data: invite });
    } catch (error) {
      next(error);
    }
  };

  updateMember = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = validateInput(changeMemberRoleSchema, req.body);
      const updated = await this.service.changeMemberRole(
        req.params.id,
        req.params.membershipId,
        dto,
        req.user!.id,
        req.ip,
        req.session?.id
      );
      res.status(200).json({ data: updated });
    } catch (error) {
      next(error);
    }
  };
}
