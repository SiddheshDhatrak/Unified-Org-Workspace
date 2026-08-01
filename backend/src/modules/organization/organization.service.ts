import crypto from 'crypto';
import { OrganizationRepository } from './organization.repository';
import { UpdateOrgSettingsDTO, InviteUserDTO, ChangeMemberRoleDTO } from './organization.types';
import { NotFoundError, QuotaExceededError, ValidationError } from '../../shared/errors/AppError';
import { AuditFacade } from '../audit/audit.facade';
import { AUDIT_ACTIONS } from '../../shared/constants/audit.constants';
import { OrgStatus } from '@prisma/client';
import { sendInvitationEmail } from '../../shared/email/email.service';

const PLAN_QUOTAS: Record<string, { maxMembers: number }> = {
  free: { maxMembers: 5 },
  standard: { maxMembers: 50 },
};

export class OrganizationService {
  private repo: OrganizationRepository;

  constructor(repo = new OrganizationRepository()) {
    this.repo = repo;
  }

  async getOrgDetail(orgId: string) {
    const org = await this.repo.findById(orgId);
    if (!org) {
      throw new NotFoundError('Organization not found');
    }
    return org;
  }

  async updateSettings(orgId: string, dto: UpdateOrgSettingsDTO, actorId: string, ip?: string, sessionId?: string) {
    const current = await this.getOrgDetail(orgId);
    const updatedSettings = { ...(current.settings as Record<string, any>), ...(dto.settings || {}) };

    const data: any = { settings: updatedSettings };
    if (dto.planTier) data.planTier = dto.planTier;

    const org = await this.repo.updateSettings(orgId, data);

    await AuditFacade.record({
      orgId,
      actorId,
      action: AUDIT_ACTIONS.ORG_SETTINGS_UPDATED,
      resourceType: 'ORGANIZATION',
      resourceId: orgId,
      beforeValue: current.settings,
      afterValue: org.settings,
      ip,
      sessionId,
    });

    return org;
  }

  async archiveOrg(orgId: string, actorId: string, ip?: string, sessionId?: string) {
    const org = await this.repo.updateSettings(orgId, { status: OrgStatus.ARCHIVED, archivedAt: new Date() });

    await AuditFacade.record({
      orgId,
      actorId,
      action: AUDIT_ACTIONS.ORG_ARCHIVED,
      resourceType: 'ORGANIZATION',
      resourceId: orgId,
      ip,
      sessionId,
    });

    return org;
  }

  async restoreOrg(orgId: string, actorId: string, ip?: string, sessionId?: string) {
    const org = await this.repo.updateSettings(orgId, { status: OrgStatus.ACTIVE, archivedAt: null });

    await AuditFacade.record({
      orgId,
      actorId,
      action: AUDIT_ACTIONS.ORG_RESTORED,
      resourceType: 'ORGANIZATION',
      resourceId: orgId,
      ip,
      sessionId,
    });

    return org;
  }

  async deleteOrg(orgId: string, actorId: string, ip?: string, sessionId?: string) {
    const org = await this.repo.softDelete(orgId);

    await AuditFacade.record({
      orgId,
      actorId,
      action: AUDIT_ACTIONS.ORG_DELETED,
      resourceType: 'ORGANIZATION',
      resourceId: orgId,
      ip,
      sessionId,
    });

    return org;
  }

  async listMembers(orgId: string) {
    return this.repo.getMembers(orgId);
  }

  async inviteMember(orgId: string, dto: InviteUserDTO, actorId: string, ip?: string, sessionId?: string) {
    const org = await this.getOrgDetail(orgId);
    const quota = PLAN_QUOTAS[org.planTier] || PLAN_QUOTAS.free;
    const currentCount = await this.repo.getMembersCount(orgId);

    if (currentCount >= quota.maxMembers) {
      throw new QuotaExceededError(`Organization plan tier (${org.planTier}) maximum members quota (${quota.maxMembers}) exceeded (§5.8)`);
    }

    const existingUser = await this.repo.findUserByEmail(dto.email);
    if (existingUser) {
      const membership = await this.repo.findMembershipById(orgId, existingUser.id);
      if (membership) {
        throw new ValidationError('This user is already a member of the organization.');
      }
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7d (§5.4)

    const invitation = await this.repo.createInvitation({
      orgId,
      email: dto.email,
      role: dto.role,
      appRoles: dto.appRoles || {},
      token,
      invitedBy: actorId,
      expiresAt,
    });

    const inviter = await this.repo.findUserById(actorId);

    // Fire-and-forget email sending
    sendInvitationEmail({
      recipientEmail: dto.email,
      token,
      orgName: org.name,
      inviterName: inviter?.fullName || 'A team member',
      role: dto.role || 'SUPPORT_AGENT',
      expiresInDays: 7,
    }).catch(err => console.error('Failed to send invitation email', err));


    await AuditFacade.record({
      orgId,
      actorId,
      action: AUDIT_ACTIONS.INVITATION_SENT,
      resourceType: 'INVITATION',
      resourceId: invitation.id,
      afterValue: { email: dto.email, role: dto.role },
      ip,
      sessionId,
    });

    return invitation;
  }

  async changeMemberRole(orgId: string, membershipId: string, dto: ChangeMemberRoleDTO, actorId: string, ip?: string, sessionId?: string) {
    const membership = await this.repo.findMembershipById(orgId, membershipId);
    if (!membership) {
      throw new NotFoundError('Membership not found in organization');
    }

    const data: any = {};
    if (dto.role) data.orgRole = dto.role;
    if (dto.appRoles) data.appRoles = dto.appRoles;
    if (dto.status) {
      data.status = dto.status;
      if (dto.status === 'SUSPENDED') data.suspendedAt = new Date();
    }

    const updated = await this.repo.updateMembership(membershipId, data);

    await AuditFacade.record({
      orgId,
      actorId,
      action: AUDIT_ACTIONS.MEMBERSHIP_ROLE_CHANGED,
      resourceType: 'MEMBERSHIP',
      resourceId: membershipId,
      beforeValue: { role: membership.orgRole, status: membership.status },
      afterValue: { role: updated.orgRole, status: updated.status },
      ip,
      sessionId,
    });

    return updated;
  }

  async removeMember(orgId: string, membershipId: string, actorId: string, ip?: string, sessionId?: string) {
    const membership = await this.repo.findMembershipById(orgId, membershipId);
    if (!membership) {
      throw new NotFoundError('Membership not found in organization');
    }

    const removed = await this.repo.deleteMembership(membership.id);

    await AuditFacade.record({
      orgId,
      actorId,
      action: AUDIT_ACTIONS.MEMBERSHIP_REMOVED,
      resourceType: 'MEMBERSHIP',
      resourceId: membership.id,
      beforeValue: { userId: membership.userId, role: membership.orgRole },
      afterValue: null,
      ip,
      sessionId,
    });

    return removed;
  }
}
