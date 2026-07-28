import { prisma, ExtendedPrismaClient } from '../../config/db';
import { PullRequest, PRReviewer, PRVersion, PRComment, PRShare, Prisma } from '@prisma/client';

export class PRRepository {
  private db: ExtendedPrismaClient;

  constructor(db: ExtendedPrismaClient = prisma) {
    this.db = db;
  }

  async create(orgId: string, data: Prisma.PullRequestUncheckedCreateInput, tx?: any): Promise<PullRequest> {
    const client = tx || this.db;
    return client.pullRequest.create({
      data: { ...data, orgId },
    });
  }

  async findById(orgId: string, id: string): Promise<(PullRequest & { author: { id: string; fullName: string }; reviewers: Array<PRReviewer & { reviewer: { id: string; fullName: string } }> }) | null> {
    return this.db.pullRequest.findFirst({
      where: { id, orgId },
      include: {
        author: { select: { id: true, fullName: true } },
        reviewers: { include: { reviewer: { select: { id: true, fullName: true } } } },
      },
    });
  }

  async findByIdUnscoped(id: string): Promise<PullRequest | null> {
    return this.db.pullRequest.findFirst({ where: { id } });
  }

  async list(orgId: string): Promise<PullRequest[]> {
    return this.db.pullRequest.findMany({
      where: { orgId },
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { id: true, fullName: true } },
      },
    });
  }

  async update(orgId: string, id: string, data: Prisma.PullRequestUncheckedUpdateInput, tx?: any): Promise<PullRequest> {
    const client = tx || this.db;
    return client.pullRequest.update({
      where: { id },
      data,
    });
  }

  async createVersion(prId: string, versionNumber: number, diff: any, snapshot: any, createdById: string, tx?: any): Promise<PRVersion> {
    const client = tx || this.db;
    return client.pRVersion.create({
      data: { prId, versionNumber, diff, snapshot, createdById },
    });
  }

  async listVersions(orgId: string, prId: string): Promise<PRVersion[]> {
    // verify ownership first via findById or caller
    return this.db.pRVersion.findMany({
      where: { prId },
      orderBy: { versionNumber: 'asc' },
    });
  }

  async getVersion(prId: string, versionNumber: number): Promise<PRVersion | null> {
    return this.db.pRVersion.findUnique({
      where: { prId_versionNumber: { prId, versionNumber } },
    });
  }

  async upsertReviewer(prId: string, reviewerId: string, decision: any, tx?: any): Promise<PRReviewer> {
    const client = tx || this.db;
    const now = new Date();
    return client.pRReviewer.upsert({
      where: { prId_reviewerId: { prId, reviewerId } },
      update: { decision, decidedAt: now },
      create: { prId, reviewerId, decision, decidedAt: now },
    });
  }

  async getApprovedCount(prId: string, tx?: any): Promise<number> {
    const client = tx || this.db;
    return client.pRReviewer.count({
      where: { prId, decision: 'APPROVED' },
    });
  }

  async getReviewers(prId: string, tx?: any): Promise<PRReviewer[]> {
    const client = tx || this.db;
    return client.pRReviewer.findMany({ where: { prId } });
  }

  async addComment(prId: string, authorId: string, versionNumber: number, body: string, threadId?: string): Promise<PRComment> {
    return this.db.pRComment.create({
      data: { prId, authorId, versionNumber, body, threadId: threadId || null },
    });
  }

  async getComments(prId: string): Promise<Array<PRComment & { author: { id: string; fullName: string } }>> {
    return this.db.pRComment.findMany({
      where: { prId, deletedAt: null },
      orderBy: { createdAt: 'asc' },
      include: { author: { select: { id: true, fullName: true } } },
    });
  }

  async createShare(prId: string, sharedWithOrgId: string, orgConnectionId: string, sharedById: string, expiresAt?: Date): Promise<PRShare> {
    return this.db.pRShare.create({
      data: { prId, sharedWithOrgId, orgConnectionId, sharedById, expiresAt: expiresAt || null },
    });
  }
}
