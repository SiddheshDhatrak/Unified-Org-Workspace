import { prisma, ExtendedPrismaClient } from '../../config/db';
import { User, Session, RefreshToken, Membership, Organization, Invitation } from '@prisma/client';

export class IdentityRepository {
  private db: ExtendedPrismaClient;

  constructor(db: ExtendedPrismaClient = prisma) {
    this.db = db;
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return this.db.user.findFirst({ where: { email } });
  }

  async findUserById(id: string): Promise<User | null> {
    return this.db.user.findFirst({ where: { id } });
  }

  async createSession(userId: string, deviceInfo?: string, ip?: string, expiresAt?: Date, tx?: any): Promise<Session> {
    const client = tx || this.db;
    const expiry = expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days default
    return client.session.create({
      data: {
        userId,
        deviceInfo: deviceInfo || null,
        ip: ip || null,
        expiresAt: expiry,
      },
    });
  }

  async createRefreshToken(sessionId: string, tokenHash: string, expiresAt: Date, rotatedFrom?: string, tx?: any): Promise<RefreshToken> {
    const client = tx || this.db;
    return client.refreshToken.create({
      data: {
        sessionId,
        tokenHash,
        expiresAt,
        rotatedFrom: rotatedFrom || null,
      },
    });
  }

  async findRefreshTokenByHash(tokenHash: string): Promise<(RefreshToken & { session: Session }) | null> {
    return this.db.refreshToken.findUnique({
      where: { tokenHash },
      include: { session: true },
    });
  }

  async findRefreshTokenByRotatedFrom(oldHash: string): Promise<RefreshToken | null> {
    return this.db.refreshToken.findFirst({
      where: { rotatedFrom: oldHash },
    });
  }

  async revokeSession(sessionId: string, tx?: any): Promise<void> {
    const client = tx || this.db;
    const now = new Date();
    await client.session.update({
      where: { id: sessionId },
      data: { revokedAt: now },
    });
    await client.refreshToken.updateMany({
      where: { sessionId, revokedAt: null },
      data: { revokedAt: now },
    });
  }

  async revokeAllUserSessions(userId: string, tx?: any): Promise<void> {
    const client = tx || this.db;
    const now = new Date();
    const sessions = await client.session.findMany({ where: { userId, revokedAt: null }, select: { id: true } });
    const sessionIds = sessions.map((s: { id: string }) => s.id);
    if (sessionIds.length > 0) {
      await client.session.updateMany({
        where: { id: { in: sessionIds } },
        data: { revokedAt: now },
      });
      await client.refreshToken.updateMany({
        where: { sessionId: { in: sessionIds }, revokedAt: null },
        data: { revokedAt: now },
      });
    }
  }

  async getActiveMemberships(userId: string): Promise<Array<Membership & { org: Organization }>> {
    return this.db.membership.findMany({
      where: { userId, status: 'ACTIVE' },
      include: { org: true },
      orderBy: { lastActiveAt: 'desc' },
    });
  }

  async getMembershipByOrg(userId: string, orgId: string): Promise<(Membership & { org: Organization }) | null> {
    return this.db.membership.findFirst({
      where: { userId, orgId, status: 'ACTIVE' },
      include: { org: true },
    });
  }

  async updateMembershipLastActive(membershipId: string): Promise<void> {
    await this.db.membership.update({
      where: { id: membershipId },
      data: { lastActiveAt: new Date() },
    });
  }

  async findInvitationByToken(token: string): Promise<Invitation | null> {
    return this.db.invitation.findUnique({ where: { token } });
  }
}
