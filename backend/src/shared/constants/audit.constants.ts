/**
 * Enumerated taxonomy of Audit Events (§14.1)
 * Follows <resourceType>.<verb> convention.
 */
export const AUDIT_ACTIONS = {
  // Auth & Identity
  AUTH_REGISTER: 'auth.register',
  AUTH_LOGIN: 'auth.login',
  AUTH_LOGOUT: 'auth.logout',
  AUTH_LOGOUT_ALL: 'auth.logout_all',
  AUTH_TOKEN_REVOKED: 'auth.token_revoked',
  AUTH_ORG_SWITCHED: 'audit.org.switched',
  USER_PROFILE_UPDATED: 'user.profile_updated',

  // Organization & Memberships
  ORG_CREATED: 'org.created',
  ORG_SETTINGS_UPDATED: 'org.settings_updated',
  ORG_ARCHIVED: 'org.archived',
  ORG_RESTORED: 'org.restored',
  ORG_DELETED: 'org.deleted',
  ORG_OWNERSHIP_TRANSFERRED: 'audit.org.ownership_transferred',
  INVITATION_SENT: 'invitation.sent',
  INVITATION_ACCEPTED: 'invitation.accepted',
  MEMBERSHIP_ROLE_CHANGED: 'membership.role_changed',
  MEMBERSHIP_STATUS_CHANGED: 'membership.status_changed',
  MEMBERSHIP_REMOVED: 'membership.removed',

  // Feature Flags
  FLAG_TOGGLED: 'flag.toggled',

  // Tickets (Support Hub)
  TICKET_CREATED: 'ticket.created',
  TICKET_UPDATED: 'ticket.updated',
  TICKET_STATUS_CHANGED: 'ticket.status_changed',
  TICKET_ASSIGNED: 'ticket.assigned',
  TICKET_DELETED: 'ticket.deleted',
  TICKET_COMMENT_ADDED: 'ticket.comment_added',
  TICKET_ATTACHMENT_UPLOADED: 'ticket.attachment_uploaded',
  TICKET_SHARED: 'ticket.shared',
  TICKET_SHARE_REVOKED: 'ticket.share_revoked',

  // Pull Requests (Review Console)
  PR_CREATED: 'pr.created',
  PR_UPDATED: 'pr.updated',
  PR_SUBMITTED: 'pr.submitted',
  PR_REVIEWER_ASSIGNED: 'pr.reviewer_assigned',
  PR_REVIEWED: 'pr.reviewed',
  PR_MERGED: 'pr.merged',
  PR_VERSION_CREATED: 'pr.version_created',
  PR_VERSION_RESTORED: 'pr.version_restored',
  PR_COMMENT_ADDED: 'pr.comment_added',
  PR_SHARED: 'pr.shared',
  PR_SHARE_REVOKED: 'pr.share_revoked',

  // Cross-Org Connections
  ORG_CONNECTION_REQUESTED: 'org.connection_requested',
  ORG_CONNECTION_APPROVED: 'org.connection_approved',
  ORG_CONNECTION_REJECTED: 'org.connection_rejected',
  ORG_CONNECTION_REVOKED: 'org.connection_revoked',
} as const;

export type AuditActionType = typeof AUDIT_ACTIONS[keyof typeof AUDIT_ACTIONS];
