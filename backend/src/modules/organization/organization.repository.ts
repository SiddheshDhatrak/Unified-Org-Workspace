import { prisma, ExtendedPrismaClient } from '../../config/db';
import { Organization, Membership, Invitation, User } from '@prisma/client';

export class OrganizationRepository {
  private db: ExtendedPrismaClient;

  constructor(db: ExtendedPrismaClient = prisma) {
    this.db = db;
  }

  async findById(orgId: string): Promise<Organization | null> {
    return this.db.organization.findUnique({ where: { id: orgId } });
  }

  async findBySlug(slug: string): Promise<Organization | null> {
    return this.db.organization.findUnique({ where: { slug } });
  }

  async updateSettings(orgId: string, data: any): Promise<Organization> {
    return this.db.organization.update({
      where: { id: orgId },
      data,
    });
  }

  async softDelete(orgId: string): Promise<Organization> {
    const now = new Date();
    return this.db.organization.update({
      where: { id: orgId },
      data: { status: 'DELETED', deletedAt: now },
    });
  }

  async getMembersCount(orgId: string): Promise<number> {
    return this.db.membership.count({ where: { orgId, status: 'ACTIVE' } });
  }

  async getMembers(orgId: string): Promise<Array<Membership & { user: { id: string; email: string; fullName: string; avatarUrl: string | null } }>> {
    return this.db.membership.findMany({
      where: { orgId },
      include: {
        user: {
          select: { id: true, email: true, fullName: true, avatarUrl: true },
        },
      },
    });
  }

  async createInvitation(data: any): Promise<Invitation> {
    return this.db.invitation.create({ data });
  }

  async findMembershipById(orgId: string, membershipId: string): Promise<Membership | null> {
    return this.db.membership.findFirst({
      where: { orgId, OR: [{ id: membershipId }, { userId: membershipId }] },
    });
  }

  async updateMembership(membershipId: string, data: any): Promise<Membership> {
    return this.db.membership.update({
      where: { id: membershipId },
      data,
    });
  }

  async deleteMembership(membershipId: string): Promise<Membership> {
    return this.db.membership.delete({
      where: { id: membershipId },
    });
  }

  async findUserById(userId: string): Promise<User | null> {
    return this.db.user.findUnique({ where: { id: userId } });
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return this.db.user.findUnique({ where: { email } });
  }
}
