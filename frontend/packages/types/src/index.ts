/**
 * Authoritative Shared TypeScript Types & RBAC Matrix
 * Mirrored 1:1 from Backend PRD and Prisma Schema
 */

export enum OrgRole {
  PLATFORM_SUPER_ADMIN = 'PLATFORM_SUPER_ADMIN',
  ORG_ADMIN = 'ORG_ADMIN',
  SUPPORT_AGENT = 'SUPPORT_AGENT',
  REVIEWER_APPROVER = 'REVIEWER_APPROVER',
  CROSS_ORG_GUEST = 'CROSS_ORG_GUEST',
}

export type PermissionAction =
  | 'ticket:create'
  | 'ticket:read'
  | 'ticket:update'
  | 'ticket:delete'
  | 'ticket:comment'
  | 'pr:create'
  | 'pr:read'
  | 'pr:review'
  | 'pr:comment'
  | 'audit:read'
  | 'audit:export'
  | 'org:manage'
  | 'crossorg:connect'
  | 'crossorg:share'
  | 'platform:manage';

/**
 * Resource & Action Permission Matrix (§7.3)
 */
export const PERMISSION_MATRIX: Record<PermissionAction, OrgRole[]> = {
  'ticket:create': [OrgRole.ORG_ADMIN, OrgRole.SUPPORT_AGENT, OrgRole.REVIEWER_APPROVER],
  'ticket:read': [OrgRole.ORG_ADMIN, OrgRole.SUPPORT_AGENT, OrgRole.REVIEWER_APPROVER],
  'ticket:update': [OrgRole.ORG_ADMIN, OrgRole.SUPPORT_AGENT],
  'ticket:delete': [OrgRole.ORG_ADMIN, OrgRole.SUPPORT_AGENT],
  'ticket:comment': [OrgRole.ORG_ADMIN, OrgRole.SUPPORT_AGENT, OrgRole.REVIEWER_APPROVER],
  'pr:create': [OrgRole.ORG_ADMIN, OrgRole.REVIEWER_APPROVER],
  'pr:read': [OrgRole.ORG_ADMIN, OrgRole.REVIEWER_APPROVER, OrgRole.SUPPORT_AGENT],
  'pr:review': [OrgRole.ORG_ADMIN, OrgRole.REVIEWER_APPROVER],
  'pr:comment': [OrgRole.ORG_ADMIN, OrgRole.REVIEWER_APPROVER],
  'audit:read': [OrgRole.ORG_ADMIN, OrgRole.REVIEWER_APPROVER],
  'audit:export': [OrgRole.ORG_ADMIN],
  'org:manage': [OrgRole.ORG_ADMIN],
  'crossorg:connect': [OrgRole.ORG_ADMIN],
  'crossorg:share': [OrgRole.ORG_ADMIN, OrgRole.SUPPORT_AGENT, OrgRole.REVIEWER_APPROVER],
  'platform:manage': [OrgRole.PLATFORM_SUPER_ADMIN],
};

export function checkPermission(userOrgRole: OrgRole | undefined, permission: PermissionAction, isPlatformSuperAdmin = false): boolean {
  if (isPlatformSuperAdmin) return true;
  if (!userOrgRole) return false;
  const allowedRoles = PERMISSION_MATRIX[permission] || [];
  return allowedRoles.includes(userOrgRole);
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  isPlatformSuperAdmin: boolean;
  emailVerifiedAt?: string | null;
}

export interface AvailableOrg {
  id: string;
  name: string;
  slug: string;
  role: OrgRole;
  appRoles: Record<string, string[]>;
  status: 'ACTIVE' | 'SUSPENDED' | 'REMOVED';
  settings?: Record<string, any>;
}

export interface SessionPayload {
  user: User;
  activeOrg: AvailableOrg & {
    isGuestView?: boolean;
    partnerOrgName?: string;
  };
  availableOrgs: AvailableOrg[];
}

export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'BLOCKED' | 'RESOLVED' | 'CLOSED';

export interface Ticket {
  id: string;
  orgId: string;
  createdById: string;
  assignedToId?: string | null;
  title: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  version: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: { id: string; fullName: string; avatarUrl?: string };
  assignedTo?: { id: string; fullName: string; avatarUrl?: string };
  shares?: Array<{ sharedWithOrgId: string; partnerOrgName?: string }>;
  _count?: { comments: number; attachments: number };
}

export interface TicketComment {
  id: string;
  ticketId: string;
  authorId: string;
  body: string;
  createdAt: string;
  author?: { id: string; fullName: string; avatarUrl?: string };
}

export type PRStatus = 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED' | 'MERGED';
export type ReviewDecision = 'PENDING' | 'APPROVED' | 'CHANGES_REQUESTED';

export interface PullRequest {
  id: string;
  orgId: string;
  authorId: string;
  title: string;
  description: string;
  status: PRStatus;
  requiredApprovals: number;
  createdAt: string;
  updatedAt: string;
  author?: { id: string; fullName: string; avatarUrl?: string };
  reviewers?: Array<{
    id: string;
    reviewerId: string;
    decision: ReviewDecision;
    decidedAt?: string;
    reviewer?: { id: string; fullName: string; avatarUrl?: string };
  }>;
  shares?: Array<{ sharedWithOrgId: string; partnerOrgName?: string }>;
  _count?: { comments: number; versions: number };
}

export interface PRVersion {
  id: string;
  prId: string;
  versionNumber: number;
  diff: Array<{ count?: number; added?: boolean; removed?: boolean; value: string }>;
  snapshot: { title: string; description: string };
  createdById: string;
  createdAt: string;
  creator?: { id: string; fullName: string; avatarUrl?: string };
}

export interface PRComment {
  id: string;
  prId: string;
  versionId: string;
  authorId: string;
  body: string;
  lineIndex?: number;
  createdAt: string;
  author?: { id: string; fullName: string; avatarUrl?: string };
  versionNumber?: number;
}

export interface AuditEvent {
  id: string;
  orgId: string;
  actorId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  beforeValue?: any;
  afterValue?: any;
  ip?: string;
  createdAt: string;
  actor?: { id: string; fullName: string; avatarUrl?: string };
}

export type NotificationType =
  | 'TICKET_ASSIGNED'
  | 'PR_REVIEW_REQUESTED'
  | 'ORG_CONNECTION_REQUESTED'
  | 'ORG_CONNECTION_APPROVED'
  | 'DIGEST_READY';

export interface Notification {
  id: string;
  userId: string;
  orgId: string;
  type: NotificationType;
  title: string;
  body: string;
  resourceId?: string;
  resourceType?: string;
  read: boolean;
  count: number; // For collapsed batching (§16.4)
  createdAt: string;
}

export interface AIDigest {
  id: string;
  orgId: string;
  userId?: string | null;
  content: string;
  generatedAt: string;
}

export interface OrgConnection {
  id: string;
  requestingOrgId: string;
  partnerOrgId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVOKED';
  requestedBy?: { id: string; fullName: string };
  partnerOrg?: { id: string; name: string; slug: string };
  requestingOrg?: { id: string; name: string; slug: string };
  sharedItemsCount?: number;
}

export interface FeatureFlag {
  id: string;
  orgId: string;
  key: string;
  enabled: boolean;
  description?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  nextCursor?: string | null;
}
