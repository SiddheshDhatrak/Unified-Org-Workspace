import { ApiError } from './errors';
import {
  SessionPayload,
  Ticket,
  PullRequest,
  PRVersion,
  PRComment,
  TicketComment,
  AuditEvent,
  Notification,
  AIDigest,
  OrgConnection,
  FeatureFlag,
  PaginatedResponse,
} from '@workspace/types';

export const API_BASE_URL = typeof window !== 'undefined'
  ? (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000')
  : 'http://localhost:4000';

function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
  return undefined;
}

function generateRequestId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `req-${Math.random().toString(36).substring(2, 11)}`;
}

let refreshPromise: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-Request-Id': generateRequestId(),
        },
      });
      refreshPromise = null;
      return res.ok;
    } catch {
      refreshPromise = null;
      return false;
    }
  })();

  return refreshPromise;
}

function redirectToLogin() {
  if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
    window.location.href = `/login?from=${encodeURIComponent(window.location.pathname)}`;
  }
}

interface RequestOptions extends RequestInit {
  _isRetry?: boolean;
  params?: Record<string, any>;
  orgId?: string;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  let url = `${API_BASE_URL}/api/v1${path}`;

  if (options.params) {
    const searchParams = new URLSearchParams();
    Object.entries(options.params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += `${url.includes('?') ? '&' : '?'}${queryString}`;
    }
  }

  const csrfToken = getCookie('csrf_token');
  const headers = new Headers(options.headers || {});

  headers.set('X-Request-Id', generateRequestId());
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (options.orgId) {
    headers.set('x-org-id', options.orgId);
  }

  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(options.method?.toUpperCase() || 'GET')) {
    if (csrfToken) {
      headers.set('X-CSRF-Token', csrfToken);
    }
  }

  const fetchOptions: RequestInit = {
    ...options,
    headers,
    credentials: 'include', // Automatically transmit HttpOnly cookies (§4.9)
  };

  const res = await fetch(url, fetchOptions);

  // Reactive silent refresh interception (§2.4 / §21.1)
  if (res.status === 401 && !options._isRetry && !path.startsWith('/auth/login') && !path.startsWith('/auth/refresh')) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      return request<T>(path, { ...options, _isRetry: true });
    } else {
      redirectToLogin();
      throw new ApiError('Session expired. Redirecting to login...', 'UNAUTHORIZED', 401);
    }
  }

  if (!res.ok) {
    let errBody = {};
    try {
      errBody = await res.json();
    } catch {
      // Ignored non-json error body
    }
    throw ApiError.fromResponse(errBody, res.status, res.headers);
  }

  if (res.status === 204) {
    return {} as T;
  }

  const json = await res.json();
  return (json.data !== undefined ? json.data : json) as T;
}

// ==========================================
// CENTRALIZED ENDPOINT FUNCTIONS (§21.2)
// ==========================================

export const auth = {
  login: (credentials: Record<string, string>) =>
    request<SessionPayload>('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (data: Record<string, any>) =>
    request<SessionPayload>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  logoutAll: () => request('/auth/logout-all', { method: 'POST' }), // (§4.5)
  switchOrg: (orgId: string) =>
    request<SessionPayload>('/auth/switch-org', { method: 'POST', body: JSON.stringify({ organizationId: orgId }) }),
  me: () => request<SessionPayload>('/auth/me'),
};

export const tickets = {
  list: (orgId: string, params?: Record<string, any>) =>
    request<PaginatedResponse<Ticket>>('/tickets', { orgId, params }),
  get: (orgId: string, ticketId: string) => request<Ticket>(`/tickets/${ticketId}`, { orgId }),
  create: (orgId: string, data: Partial<Ticket>) =>
    request<Ticket>('/tickets', { method: 'POST', orgId, body: JSON.stringify(data) }),
  update: (orgId: string, ticketId: string, data: Partial<Ticket>) =>
    request<Ticket>(`/tickets/${ticketId}`, { method: 'PATCH', orgId, body: JSON.stringify(data) }),
  delete: (orgId: string, ticketId: string) => request(`/tickets/${ticketId}`, { method: 'DELETE', orgId }),
  listComments: (orgId: string, ticketId: string) =>
    request<TicketComment[]>(`/tickets/${ticketId}/comments`, { orgId }),
  createComment: (orgId: string, ticketId: string, body: string) =>
    request<TicketComment>(`/tickets/${ticketId}/comments`, { method: 'POST', orgId, body: JSON.stringify({ body }) }),
  share: (orgId: string, ticketId: string, partnerOrgId: string) =>
    request(`/tickets/${ticketId}/share`, { method: 'POST', orgId, body: JSON.stringify({ partnerOrgId }) }),
  revokeShare: (orgId: string, ticketId: string, partnerOrgId: string) =>
    request(`/tickets/${ticketId}/share/${partnerOrgId}`, { method: 'DELETE', orgId }),
};

export const prs = {
  list: (orgId: string, params?: Record<string, any>) =>
    request<PaginatedResponse<PullRequest>>('/prs', { orgId, params }),
  get: (orgId: string, prId: string) => request<PullRequest>(`/prs/${prId}`, { orgId }),
  create: (orgId: string, data: Record<string, any>) =>
    request<PullRequest>('/prs', { method: 'POST', orgId, body: JSON.stringify(data) }),
  review: (orgId: string, prId: string, decision: 'APPROVED' | 'CHANGES_REQUESTED', comment?: string) =>
    request(`/prs/${prId}/review`, { method: 'POST', orgId, body: JSON.stringify({ decision, comment }) }),
  merge: (orgId: string, prId: string) => request(`/prs/${prId}/merge`, { method: 'POST', orgId }),
  listVersions: (orgId: string, prId: string) => request<PRVersion[]>(`/prs/${prId}/versions`, { orgId }),
  getVersion: (orgId: string, prId: string, versionNumber: number) =>
    request<PRVersion>(`/prs/${prId}/versions/${versionNumber}`, { orgId }),
  restoreVersion: (orgId: string, prId: string, versionNumber: number) =>
    request(`/prs/${prId}/rollback`, { method: 'POST', orgId, body: JSON.stringify({ versionNumber }) }),
  listComments: (orgId: string, prId: string) => request<PRComment[]>(`/prs/${prId}/comments`, { orgId }),
  createComment: (orgId: string, prId: string, data: Record<string, any>) =>
    request<PRComment>(`/prs/${prId}/comments`, { method: 'POST', orgId, body: JSON.stringify(data) }),
};

export const orgs = {
  getSettings: (orgId: string) => request<Record<string, any>>(`/organizations/${orgId}`, { orgId }),
  updateSettings: (orgId: string, data: Record<string, any>) =>
    request(`/organizations/${orgId}`, { method: 'PATCH', orgId, body: JSON.stringify(data) }),
  listMembers: (orgId: string) => request<Array<Record<string, any>>>(`/organizations/${orgId}/members`, { orgId }),
  inviteMember: (orgId: string, email: string, role: string, appRoles?: Record<string, any>) =>
    request(`/organizations/${orgId}/members/invite`, { method: 'POST', orgId, body: JSON.stringify({ email, role, appRoles }) }),
  updateMember: (orgId: string, userId: string, data: Record<string, any>) =>
    request(`/organizations/${orgId}/members/${userId}`, { method: 'PATCH', orgId, body: JSON.stringify(data) }),
  removeMember: (orgId: string, userId: string) =>
    request(`/organizations/${orgId}/members/${userId}`, { method: 'DELETE', orgId }),
};

export const connections = {
  list: (orgId: string) => request<OrgConnection[]>('/org-connections', { orgId }),
  request: (orgId: string, partnerSlug: string) =>
    request<OrgConnection>('/org-connections', { method: 'POST', orgId, body: JSON.stringify({ partnerSlug }) }),
  approve: (orgId: string, id: string) =>
    request<OrgConnection>(`/org-connections/${id}/approve`, { method: 'POST', orgId }),
  revoke: (orgId: string, id: string) =>
    request(`/org-connections/${id}`, { method: 'DELETE', orgId }),
};

export const auditFeed = {
  list: (orgId: string, params?: Record<string, any>) =>
    request<PaginatedResponse<AuditEvent>>('/audit', { orgId, params }),
  exportCsvUrl: (orgId: string, params?: Record<string, any>) => {
    const searchParams = new URLSearchParams(params || {});
    searchParams.append('orgId', orgId);
    return `${API_BASE_URL}/api/v1/audit/export?${searchParams.toString()}`;
  },
};

export const notificationsFeed = {
  list: (orgId: string, params?: Record<string, any>) =>
    request<PaginatedResponse<Notification>>('/notifications', { orgId, params }),
  markRead: (orgId: string, id: string) =>
    request(`/notifications/${id}/read`, { method: 'PATCH', orgId }),
  markAllRead: (orgId: string) =>
    request('/notifications/read-all', { method: 'PATCH', orgId }),
};

export const digests = {
  latest: (orgId: string) => request<AIDigest>('/digests/latest', { orgId }),
};

export const featureFlags = {
  list: (orgId: string) => request<FeatureFlag[]>(`/organizations/${orgId}/feature-flags`, { orgId }),
  toggle: (orgId: string, key: string, enabled: boolean) =>
    request(`/organizations/${orgId}/feature-flags/${key}`, { method: 'PATCH', orgId, body: JSON.stringify({ enabled }) }),
};
