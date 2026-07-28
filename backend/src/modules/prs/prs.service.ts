import * as diffLib from 'diff';
import { PRStatus, ReviewDecision, OrgRole } from '@prisma/client';
import { prisma } from '../../config/db';
import { PRRepository } from './prs.repository';
import { CreatePRDTO, UpdatePRDTO, AssignReviewerDTO, ReviewPRDTO, CreatePRCommentDTO, SharePRDTO } from './prs.types';
import { NotFoundError, InvalidStateTransitionError, ValidationError, PermissionDeniedError } from '../../shared/errors/AppError';
import { AuditFacade } from '../audit/audit.facade';
import { AUDIT_ACTIONS } from '../../shared/constants/audit.constants';

export class PRService {
  private repo: PRRepository;

  constructor(repo = new PRRepository()) {
    this.repo = repo;
  }

  private computeDiff(oldText: string, newText: string) {
    return diffLib.diffLines(oldText, newText);
  }

  async create(orgId: string, actorId: string, dto: CreatePRDTO, ip?: string, sessionId?: string) {
    // If requiredApprovals not provided, default from org settings (§11.2)
    let requiredApprovals = dto.requiredApprovals;
    if (!requiredApprovals) {
      const org = await prisma.organization.findUnique({ where: { id: orgId } });
      const settings: any = org?.settings || {};
      requiredApprovals = settings.defaultRequiredApprovals || 1;
    }

    return prisma.$transaction(async (tx) => {
      const pr = await this.repo.create(orgId, {
        orgId,
        authorId: actorId,
        title: dto.title,
        description: dto.description,
        status: PRStatus.DRAFT,
        requiredApprovals: requiredApprovals || 1,
      }, tx);

      // Initial version 1 (§12.1)
      const initialSnapshot = { title: pr.title, description: pr.description };
      await this.repo.createVersion(pr.id, 1, [], initialSnapshot, actorId, tx);

      await AuditFacade.record({
        orgId,
        actorId,
        action: AUDIT_ACTIONS.PR_CREATED,
        resourceType: 'PULL_REQUEST',
        resourceId: pr.id,
        afterValue: { title: pr.title, requiredApprovals },
        ip,
        sessionId,
      }, tx);

      return pr;
    });
  }

  async getById(orgId: string | undefined, prId: string, shareGrant?: any) {
    if (shareGrant && shareGrant.resourceId === prId) {
      const pr = await this.repo.findByIdUnscoped(prId);
      if (!pr) throw new NotFoundError('Pull Request not found');
      return { ...pr, _isReadOnlyGuestView: true };
    }

    if (!orgId) throw new NotFoundError('Pull Request not found');
    const pr = await this.repo.findById(orgId, prId);
    if (!pr) throw new NotFoundError('Pull Request not found');
    return pr;
  }

  async list(orgId: string) {
    return this.repo.list(orgId);
  }

  async submit(orgId: string, prId: string, actorId: string, ip?: string, sessionId?: string) {
    const pr = await this.getById(orgId, prId);
    if (pr.status !== PRStatus.DRAFT) {
      throw new InvalidStateTransitionError('Only DRAFT Pull Requests can be submitted for review (§11.2)');
    }

    return prisma.$transaction(async (tx) => {
      const updated = await this.repo.update(orgId, prId, { status: PRStatus.IN_REVIEW }, tx);

      await AuditFacade.record({
        orgId,
        actorId,
        action: AUDIT_ACTIONS.PR_SUBMITTED,
        resourceType: 'PULL_REQUEST',
        resourceId: prId,
        beforeValue: { status: PRStatus.DRAFT },
        afterValue: { status: PRStatus.IN_REVIEW },
        ip,
        sessionId,
      }, tx);

      return updated;
    });
  }

  async update(orgId: string, prId: string, actorId: string, dto: UpdatePRDTO, ip?: string, sessionId?: string) {
    const pr = await this.getById(orgId, prId);
    if (pr.status === PRStatus.MERGED) {
      throw new InvalidStateTransitionError('Cannot modify a MERGED Pull Request');
    }

    const newTitle = dto.title !== undefined ? dto.title : pr.title;
    const newDescription = dto.description !== undefined ? dto.description : pr.description;

    return prisma.$transaction(async (tx) => {
      const updated = await this.repo.update(orgId, prId, {
        title: newTitle,
        description: newDescription,
      }, tx);

      // §12.1: "Every edit made after review has started creates a new immutable PRVersion row"
      if (pr.status !== PRStatus.DRAFT) {
        const versions = await this.repo.listVersions(orgId, prId);
        const latestVersion = versions[versions.length - 1];
        const nextVerNum = (latestVersion?.versionNumber || 0) + 1;

        const oldSnapshot: any = latestVersion?.snapshot || { title: '', description: '' };
        const oldText = `Title: ${oldSnapshot.title}\nDescription: ${oldSnapshot.description}`;
        const newText = `Title: ${newTitle}\nDescription: ${newDescription}`;
        
        const diff = this.computeDiff(oldText, newText);
        const newSnapshot = { title: newTitle, description: newDescription };

        await this.repo.createVersion(prId, nextVerNum, diff, newSnapshot, actorId, tx);

        await AuditFacade.record({
          orgId,
          actorId,
          action: AUDIT_ACTIONS.PR_VERSION_CREATED,
          resourceType: 'PR_VERSION',
          resourceId: `${prId}:v${nextVerNum}`,
          afterValue: { versionNumber: nextVerNum },
          ip,
          sessionId,
        }, tx);
      }

      return updated;
    });
  }

  async assignReviewer(orgId: string, prId: string, actorId: string, dto: AssignReviewerDTO, ip?: string, sessionId?: string) {
    await this.getById(orgId, prId);

    // §11.3: reviewer must have REVIEWER_APPROVER app-role or orgRole in same org
    const member = await prisma.membership.findFirst({
      where: { userId: dto.reviewerId, orgId, status: 'ACTIVE' },
    });
    if (!member) {
      throw new ValidationError('Assigned reviewer is not an active member of this organization');
    }

    return prisma.$transaction(async (tx) => {
      const reviewer = await this.repo.upsertReviewer(prId, dto.reviewerId, ReviewDecision.PENDING, tx);

      await AuditFacade.record({
        orgId,
        actorId,
        action: AUDIT_ACTIONS.PR_REVIEWER_ASSIGNED,
        resourceType: 'PR_REVIEWER',
        resourceId: reviewer.id,
        afterValue: { reviewerId: dto.reviewerId },
        ip,
        sessionId,
      }, tx);

      return reviewer;
    });
  }

  async review(orgId: string, prId: string, actorId: string, dto: ReviewPRDTO, ip?: string, sessionId?: string) {
    const pr = await this.getById(orgId, prId);
    if (pr.status !== PRStatus.IN_REVIEW && pr.status !== PRStatus.APPROVED) {
      throw new InvalidStateTransitionError('PR is not currently active for review');
    }

    // SERIALIZABLE transaction isolation on decision update + recount (§11.2, §26 Edge Case 1)
    return prisma.$transaction(async (tx) => {
      const reviewer = await this.repo.upsertReviewer(prId, actorId, dto.decision, tx);

      const approvedCount = await this.repo.getApprovedCount(prId, tx);
      const allReviewers = await this.repo.getReviewers(prId, tx);
      
      let newStatus: PRStatus = pr.status;
      if (approvedCount >= pr.requiredApprovals) {
        newStatus = PRStatus.APPROVED;
      } else if (pr.status === PRStatus.APPROVED && approvedCount < pr.requiredApprovals) {
        newStatus = PRStatus.IN_REVIEW; // approval retracted
      }

      if (newStatus !== pr.status) {
        await this.repo.update(orgId, prId, { status: newStatus }, tx);
      }

      await AuditFacade.record({
        orgId,
        actorId,
        action: AUDIT_ACTIONS.PR_REVIEWED,
        resourceType: 'PULL_REQUEST',
        resourceId: prId,
        afterValue: { reviewerId: actorId, decision: dto.decision, status: newStatus },
        ip,
        sessionId,
      }, tx);

      return { reviewer, newStatus, approvedCount };
    });
  }

  async merge(orgId: string, prId: string, actorId: string, ip?: string, sessionId?: string) {
    const pr = await this.getById(orgId, prId);
    
    // §11.5 Merge Conditions: allowed only when status = APPROVED and no PENDING/CHANGES_REQUESTED outstanding
    return prisma.$transaction(async (tx) => {
      const reviewers = await this.repo.getReviewers(prId, tx);
      const hasOutstanding = reviewers.some(r => r.decision === ReviewDecision.PENDING || r.decision === ReviewDecision.CHANGES_REQUESTED);
      const approvedCount = reviewers.filter(r => r.decision === ReviewDecision.APPROVED).length;

      if (pr.status !== PRStatus.APPROVED || hasOutstanding || approvedCount < pr.requiredApprovals) {
        throw new InvalidStateTransitionError('Merge conditions not met: requires APPROVED status and zero pending/changes requested reviews (§11.5)');
      }

      const merged = await this.repo.update(orgId, prId, { status: PRStatus.MERGED }, tx);

      await AuditFacade.record({
        orgId,
        actorId,
        action: AUDIT_ACTIONS.PR_MERGED,
        resourceType: 'PULL_REQUEST',
        resourceId: prId,
        beforeValue: { status: pr.status },
        afterValue: { status: PRStatus.MERGED },
        ip,
        sessionId,
      }, tx);

      return merged;
    });
  }

  async listVersions(orgId: string, prId: string) {
    await this.getById(orgId, prId);
    return this.repo.listVersions(orgId, prId);
  }

  async getDiff(orgId: string, prId: string, versionNumber: number) {
    await this.getById(orgId, prId);
    const ver = await this.repo.getVersion(prId, versionNumber);
    if (!ver) throw new NotFoundError('PR version not found');
    return ver.diff;
  }

  async rollbackVersion(orgId: string, prId: string, versionNumber: number, actorId: string, ip?: string, sessionId?: string) {
    const pr = await this.getById(orgId, prId);
    if (pr.status !== PRStatus.DRAFT && pr.status !== PRStatus.IN_REVIEW) {
      throw new InvalidStateTransitionError('Rollback only supported in DRAFT or IN_REVIEW state (§12.4)');
    }

    const targetVer = await this.repo.getVersion(prId, versionNumber);
    if (!targetVer) throw new NotFoundError('Target version to restore not found');

    const versions = await this.repo.listVersions(orgId, prId);
    const latestVer = versions[versions.length - 1];
    const nextVerNum = (latestVer?.versionNumber || 0) + 1;

    return prisma.$transaction(async (tx) => {
      const snapshot: any = targetVer.snapshot;
      await this.repo.update(orgId, prId, { title: snapshot.title, description: snapshot.description }, tx);
      
      const newVer = await this.repo.createVersion(prId, nextVerNum, [], snapshot, actorId, tx);

      await AuditFacade.record({
        orgId,
        actorId,
        action: AUDIT_ACTIONS.PR_VERSION_RESTORED,
        resourceType: 'PR_VERSION',
        resourceId: `${prId}:v${nextVerNum}`,
        afterValue: { restoredFrom: versionNumber, newVersionNumber: nextVerNum },
        ip,
        sessionId,
      }, tx);

      return newVer;
    });
  }

  async addComment(orgId: string | undefined, prId: string, actorId: string, dto: CreatePRCommentDTO, shareGrant?: any) {
    if (shareGrant && shareGrant.resourceId === prId) {
      return this.repo.addComment(prId, actorId, dto.versionNumber || 1, dto.body, dto.threadId);
    }
    if (!orgId) throw new NotFoundError('Pull Request not found');
    const pr = await this.getById(orgId, prId);
    const versions = await this.repo.listVersions(orgId, prId);
    const latestVersionNum = versions[versions.length - 1]?.versionNumber || 1;
    
    const verNum = dto.versionNumber || latestVersionNum;
    return this.repo.addComment(prId, actorId, verNum, dto.body, dto.threadId);
  }

  async listComments(orgId: string | undefined, prId: string, shareGrant?: any) {
    if (shareGrant && shareGrant.resourceId === prId) {
      return this.repo.getComments(prId);
    }
    if (!orgId) throw new NotFoundError('Pull Request not found');
    await this.getById(orgId, prId);
    return this.repo.getComments(prId);
  }

  async share(orgId: string, prId: string, actorId: string, dto: SharePRDTO, ip?: string, sessionId?: string) {
    await this.getById(orgId, prId);
    const conn = await prisma.orgConnection.findFirst({
      where: {
        status: 'APPROVED',
        revokedAt: null,
        OR: [
          { requestingOrgId: orgId, partnerOrgId: dto.partnerOrgId },
          { requestingOrgId: dto.partnerOrgId, partnerOrgId: orgId },
        ],
      },
    });
    if (!conn) {
      throw new PermissionDeniedError('An APPROVED OrgConnection is required before sharing resources');
    }
    const expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : undefined;
    const share = await this.repo.createShare(prId, dto.partnerOrgId, conn.id, actorId, expiresAt);

    await AuditFacade.record({
      orgId,
      actorId,
      action: AUDIT_ACTIONS.PR_SHARED,
      resourceType: 'PR_SHARE',
      resourceId: share.id,
      afterValue: { prId, partnerOrgId: dto.partnerOrgId },
      ip,
      sessionId,
    });

    return share;
  }
}
