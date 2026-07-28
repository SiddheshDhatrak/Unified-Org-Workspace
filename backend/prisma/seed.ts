import { PrismaClient, OrgRole, TicketPriority, PRStatus, ReviewDecision } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Database Seeding for Unified Org Workspace...');

  // Clean existing tables (if any)
  await prisma.auditEvent.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.digest.deleteMany({});
  await prisma.ticketShare.deleteMany({});
  await prisma.pRShare.deleteMany({});
  await prisma.orgConnection.deleteMany({});
  await prisma.pRComment.deleteMany({});
  await prisma.pRVersion.deleteMany({});
  await prisma.pRReviewer.deleteMany({});
  await prisma.pullRequest.deleteMany({});
  await prisma.ticketComment.deleteMany({});
  await prisma.attachment.deleteMany({});
  await prisma.ticket.deleteMany({});
  await prisma.membership.deleteMany({});
  await prisma.featureFlag.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.organization.deleteMany({});
  await prisma.user.deleteMany({});

  const standardPassword = await argon2.hash('Password123!');

  // 1. Create Users
  const superAdmin = await prisma.user.create({
    data: {
      email: 'superadmin@unified.org',
      passwordHash: standardPassword,
      fullName: 'Platform Super Admin',
      isPlatformSuperAdmin: true,
      emailVerifiedAt: new Date(),
    },
  });

  const alice = await prisma.user.create({
    data: {
      email: 'alice@acme.com',
      passwordHash: standardPassword,
      fullName: 'Alice Acme (Admin)',
      emailVerifiedAt: new Date(),
    },
  });

  const bob = await prisma.user.create({
    data: {
      email: 'bob@acme.com',
      passwordHash: standardPassword,
      fullName: 'Bob Acme (Agent & Approver)',
      emailVerifiedAt: new Date(),
    },
  });

  const charlie = await prisma.user.create({
    data: {
      email: 'charlie@globex.com',
      passwordHash: standardPassword,
      fullName: 'Charlie Globex (Admin)',
      emailVerifiedAt: new Date(),
    },
  });

  console.log('✅ Created 4 standard test users (password: Password123!)');

  // 2. Create Orgs: Acme Corp & Globex Corporation
  const acme = await prisma.organization.create({
    data: {
      name: 'Acme Corp',
      slug: 'acme',
      status: 'ACTIVE',
      ownerId: alice.id,
      settings: { maxMembers: 50, defaultRequiredApprovals: 1 },
    },
  });

  const globex = await prisma.organization.create({
    data: {
      name: 'Globex Corporation',
      slug: 'globex',
      status: 'ACTIVE',
      ownerId: charlie.id,
      settings: { maxMembers: 100, defaultRequiredApprovals: 2 },
    },
  });

  console.log('✅ Created Organizations: Acme Corp (acme) & Globex Corporation (globex)');

  // 3. Create Memberships
  await prisma.membership.create({
    data: { userId: alice.id, orgId: acme.id, orgRole: OrgRole.ORG_ADMIN, status: 'ACTIVE' },
  });
  await prisma.membership.create({
    data: {
      userId: bob.id,
      orgId: acme.id,
      orgRole: OrgRole.SUPPORT_AGENT,
      status: 'ACTIVE',
      appRoles: { support: ['SUPPORT_AGENT'], review: ['REVIEWER_APPROVER'] },
    },
  });
  await prisma.membership.create({
    data: { userId: charlie.id, orgId: globex.id, orgRole: OrgRole.ORG_ADMIN, status: 'ACTIVE' },
  });

  // 4. Feature Flags
  await prisma.featureFlag.create({
    data: { orgId: acme.id, key: 'enable-ai-digest', enabled: true },
  });
  await prisma.featureFlag.create({
    data: { orgId: acme.id, key: 'beta-analytics', enabled: false },
  });

  // 5. Create Tickets (Support Hub) in Acme
  const ticket1 = await prisma.ticket.create({
    data: {
      orgId: acme.id,
      createdById: alice.id,
      assignedToId: bob.id,
      title: 'Login authentication timeout spikes',
      description: 'Customers report slow logins during peak hours.',
      priority: TicketPriority.HIGH,
      status: 'OPEN',
      version: 1,
    },
  });

  await prisma.ticketComment.create({
    data: {
      ticketId: ticket1.id,
      authorId: bob.id,
      body: 'Investigating Redis latency and Auth0 callback timeouts.',
    },
  });

  // 6. Create Pull Requests (Review Console) in Acme
  const pr1 = await prisma.pullRequest.create({
    data: {
      orgId: acme.id,
      authorId: alice.id,
      title: 'Fix: increase DB pool and Redis timeout',
      description: 'Increases pg connection limit to 50 and adds retry exponential backoff.',
      status: PRStatus.IN_REVIEW,
      requiredApprovals: 1,
    },
  });

  await prisma.pRVersion.create({
    data: {
      prId: pr1.id,
      versionNumber: 1,
      diff: [{ count: 2, added: true, removed: false, value: 'connection_limit=50' }],
      snapshot: { title: pr1.title, description: pr1.description },
      createdById: alice.id,
    },
  });

  await prisma.pRReviewer.create({
    data: {
      prId: pr1.id,
      reviewerId: bob.id,
      decision: ReviewDecision.APPROVED,
      decidedAt: new Date(),
    },
  });

  // 7. Cross-Org Connection & Share
  const conn = await prisma.orgConnection.create({
    data: {
      requestingOrgId: acme.id,
      partnerOrgId: globex.id,
      status: 'APPROVED',
      requestedById: alice.id,
      respondedById: charlie.id,
      respondedAt: new Date(),
    },
  });

  await prisma.ticketShare.create({
    data: {
      ticketId: ticket1.id,
      sharedWithOrgId: globex.id,
      orgConnectionId: conn.id,
      sharedById: alice.id,
    },
  });

  // 8. Initial Audit Record
  await prisma.auditEvent.create({
    data: {
      orgId: acme.id,
      actorId: alice.id,
      action: 'ticket.created',
      resourceType: 'TICKET',
      resourceId: ticket1.id,
      afterValue: { title: ticket1.title, status: 'OPEN' },
      ip: '127.0.0.1',
    },
  });

  console.log('✅ Seeded initial tickets, PRs, comments, cross-org shares, and audit trail.');
  console.log('🌾 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
