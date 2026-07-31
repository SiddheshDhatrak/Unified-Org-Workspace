import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { create } from 'zustand';
import { auth, tickets, prs, orgs, connections, auditFeed, notificationsFeed, digests, featureFlags, ApiError } from '@workspace/api-client';
import { SessionPayload, PermissionAction, checkPermission, Ticket, PullRequest, AuditEvent, Notification, FeatureFlag } from '@workspace/types';

// ==========================================
// ZUSTAND CLIENT STATE (§9.2)
// ==========================================
interface UIState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  activeOrgIdMirror: string | null;
  setActiveOrgIdMirror: (id: string | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  activeOrgIdMirror: null,
  setActiveOrgIdMirror: (id) => set({ activeOrgIdMirror: id }),
}));

// ==========================================
// CORE SESSION & RBAC HOOKS (§4.3, §7.2)
// ==========================================
export function useSession() {
  const { setActiveOrgIdMirror } = useUIStore();
  return useQuery<SessionPayload, ApiError>({
    queryKey: ['session', 'me'],
    queryFn: async () => {
      const data = await auth.me();
      if (data?.activeOrg?.id) {
        setActiveOrgIdMirror(data.activeOrg.id);
      }
      return data;
    },
    refetchOnWindowFocus: true, // §9.5
    retry: false,
    staleTime: 60 * 1000,
  });
}

export function useOrgContext() {
  const { data: session, isLoading, error } = useSession();
  const activeOrg = session?.activeOrg;
  const isGuestView = activeOrg?.role === 'CROSS_ORG_GUEST' || activeOrg?.isGuestView === true;

  return {
    orgId: activeOrg?.id || '',
    orgName: activeOrg?.name || 'Workspace',
    orgRole: activeOrg?.role,
    appRoles: activeOrg?.appRoles || {},
    isGuestView,
    partnerOrgName: activeOrg?.partnerOrgName,
    isLoading,
    error,
  };
}

export function usePermission(permission: PermissionAction): boolean {
  const { data: session } = useSession();
  if (!session || !session.activeOrg) return false;
  return checkPermission(session.activeOrg.role, permission, session.user.isPlatformSuperAdmin);
}

export function useSwitchOrg() {
  const queryClient = useQueryClient();
  const { setActiveOrgIdMirror } = useUIStore();

  return useMutation({
    mutationFn: (orgId: string) => auth.switchOrg(orgId),
    onSuccess: (newSession, orgId) => {
      setActiveOrgIdMirror(orgId);
      queryClient.setQueryData(['session', 'me'], newSession);
      // Invalidate all org-scoped queries immediately on switch (§4.7 / §9.3)
      queryClient.invalidateQueries({
        predicate: (q) => Array.isArray(q.queryKey) && q.queryKey[0] === 'org-scoped',
      });
    },
  });
}

// ==========================================
// FEATURE FLAGS & AI DIGEST HOOKS (§15.2, §17.1)
// ==========================================
export function useFeatureFlags(orgId: string) {
  return useQuery({
    queryKey: ['org-scoped', orgId, 'feature-flags'],
    queryFn: () => featureFlags.list(orgId),
    enabled: Boolean(orgId),
    staleTime: 30 * 1000, // 30s cache TTL matching Redis 60s
  });
}

export function useFeatureFlag(orgId: string, key: string): boolean {
  const { data } = useFeatureFlags(orgId);
  if (!data || !Array.isArray(data)) return false;
  const flag = data.find((f) => f.key === key);
  return flag ? flag.enabled : false;
}

export function useLatestDigest(orgId: string) {
  return useQuery({
    queryKey: ['org-scoped', orgId, 'digests', 'latest'],
    queryFn: () => digests.latest(orgId),
    enabled: Boolean(orgId),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

// ==========================================
// TICKETS HOOKS (SUPPORT HUB - §10)
// ==========================================
export function useTickets(orgId: string, filters?: Record<string, any>) {
  return useQuery({
    queryKey: ['org-scoped', orgId, 'tickets', filters],
    queryFn: () => tickets.list(orgId, filters),
    enabled: Boolean(orgId),
    staleTime: 30 * 1000,
  });
}

export function useTicketDetail(orgId: string, ticketId: string) {
  return useQuery({
    queryKey: ['org-scoped', orgId, 'tickets', ticketId],
    queryFn: () => tickets.get(orgId, ticketId),
    enabled: Boolean(orgId && ticketId),
  });
}

export function useUpdateTicketStatus(orgId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ticketId, status, version }: { ticketId: string; status: any; version: number }) =>
      tickets.update(orgId, ticketId, { status, version }),
    onSuccess: (updatedTicket) => {
      queryClient.invalidateQueries({ queryKey: ['org-scoped', orgId, 'tickets'] });
      queryClient.setQueryData(['org-scoped', orgId, 'tickets', updatedTicket.id], updatedTicket);
    },
  });
}

// ==========================================
// PR REVIEW HOOKS (REVIEW CONSOLE - §11, §12)
// ==========================================
export function usePullRequests(orgId: string, filters?: Record<string, any>) {
  return useQuery({
    queryKey: ['org-scoped', orgId, 'prs', filters],
    queryFn: () => prs.list(orgId, filters),
    enabled: Boolean(orgId),
    staleTime: 30 * 1000,
  });
}

export function usePRDetail(orgId: string, prId: string) {
  return useQuery({
    queryKey: ['org-scoped', orgId, 'prs', prId],
    queryFn: () => prs.get(orgId, prId),
    enabled: Boolean(orgId && prId),
  });
}

export function usePRVersions(orgId: string, prId: string) {
  return useQuery({
    queryKey: ['org-scoped', orgId, 'prs', prId, 'versions'],
    queryFn: () => prs.listVersions(orgId, prId),
    enabled: Boolean(orgId && prId),
  });
}

// ==========================================
// UNIFIED AUDIT VIEWER HOOKS (§14)
// ==========================================
export function useAuditFeed(orgId: string, filters?: Record<string, any>) {
  return useInfiniteQuery({
    queryKey: ['org-scoped', orgId, 'audit', filters],
    queryFn: ({ pageParam }) => auditFeed.list(orgId, { ...filters, cursor: pageParam }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
    enabled: Boolean(orgId),
  });
}

// ==========================================
// NOTIFICATION POLLING HOOK (§16.2)
// ==========================================
export function useNotifications(orgId: string) {
  return useQuery({
    queryKey: ['org-scoped', orgId, 'notifications'],
    queryFn: () => notificationsFeed.list(orgId, { read: false }),
    enabled: Boolean(orgId),
    refetchInterval: 30 * 1000, // 30s poll interval per PRD §16.2
    refetchOnWindowFocus: true,
  });
}

// ==========================================
// FORM SERVER ERROR MAPPING UTILITY (§20.2)
// ==========================================
export function applyServerErrors(form: { setError: (field: any, error: any) => void }, apiError: ApiError) {
  if (apiError.details && typeof apiError.details === 'object') {
    Object.entries(apiError.details).forEach(([field, messages]) => {
      const msg = Array.isArray(messages) ? messages[0] : String(messages);
      form.setError(field as any, { type: 'server', message: msg });
    });
  }
}
