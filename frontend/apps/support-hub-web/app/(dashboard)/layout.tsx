'use client';
import React from 'react';
import { useSession, useOrgContext } from '@workspace/hooks';
import { OrgSwitcher, NotificationBell, GuestBanner, Button, ConfirmDialog, cn } from '@workspace/ui-kit';
import {
  LifeBuoy,
  GitPullRequest,
  Shield,
  Users,
  Building2,
  Share2,
  Sliders,
  LogOut,
  FolderDot,
  Menu,
  X,
  Sparkles,
} from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { auth } from '@workspace/api-client';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, isLoading, error } = useSession();
  const { isGuestView, orgRole, orgName } = useOrgContext();
  const router = useRouter();
  const pathname = usePathname();

  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [showLogoutAllConfirm, setShowLogoutAllConfirm] = React.useState(false);
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center text-zinc-400 gap-3">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold tracking-wider uppercase animate-pulse">Hydrating workspace session...</p>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen w-full bg-[#090D16] flex flex-col items-center justify-center text-zinc-400 gap-4 p-6">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
          <svg className="w-7 h-7 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z" /></svg>
        </div>
        <h2 className="text-lg font-bold text-white">Unable to connect</h2>
        <p className="text-sm text-zinc-500 text-center max-w-sm">
          Could not reach the backend API. Make sure the server is running on <code className="text-indigo-400">localhost:4000</code>.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 px-5 py-2 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 text-indigo-300 text-sm font-bold transition-all"
        >
          Retry
        </button>
      </div>
    );
  }

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await auth.logout();
      window.location.href = '/login';
    } catch {
      window.location.href = '/login';
    }
  };

  const handleLogoutAll = async () => {
    setIsLoggingOut(true);
    try {
      await auth.logoutAll();
      window.location.href = '/login';
    } catch {
      window.location.href = '/login';
    }
  };

  const isAdmin = orgRole === 'ORG_ADMIN' || session?.user.isPlatformSuperAdmin;
  const isApprover = orgRole === 'REVIEWER_APPROVER' || isAdmin;

  return (
    <div className="min-h-screen flex flex-col bg-[#090D16] text-zinc-100 selection:bg-indigo-500/30">
      {/* Unmissable Cross-Org Guest Banner (§13.4) */}
      <GuestBanner />

      {/* Top Header */}
      <header className="sticky top-0 z-30 h-16 w-full border-b border-white/10 bg-zinc-950/80 backdrop-blur-xl flex items-center justify-between px-4 sm:px-6 shadow-md">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="sm:hidden p-2 rounded-xl text-zinc-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 p-[1px] shadow-lg shadow-indigo-500/20">
              <div className="w-full h-full bg-zinc-950 rounded-xl flex items-center justify-center text-cyan-400 font-bold">
                <LifeBuoy className="w-5 h-5" />
              </div>
            </div>
            <div>
              <span className="text-base font-extrabold tracking-tight text-white block leading-none">Support Hub</span>
              <span className="text-[10px] font-mono text-zinc-400 tracking-wider uppercase">Dashboard 1</span>
            </div>
          </div>

          <div className="hidden sm:flex items-center pl-4 border-l border-white/10">
            <OrgSwitcher />
          </div>
        </div>

        {/* Right Nav Controls */}
        <div className="flex items-center gap-3">
          <NotificationBell />

          {/* Quick Jump to Review Console (§1.1 / §18.2) */}
          <a
            href="http://localhost:3001/prs"
            target="_blank"
            rel="noreferrer"
            className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-bold transition-all shadow-[0_0_15px_rgba(168,85,247,0.15)]"
          >
            <GitPullRequest className="w-3.5 h-3.5" />
            <span>Review Console</span>
          </a>

          {/* User Profile dropdown or trigger */}
          <div className="flex items-center gap-2 pl-2 border-l border-white/10">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-white leading-none">{session?.user.fullName}</p>
              <p className="text-[10px] text-zinc-500 uppercase font-mono mt-0.5">{orgRole || 'User'}</p>
            </div>
            <button
              onClick={() => setShowLogoutAllConfirm(true)}
              title="Logout Options (§4.5)"
              className="p-2 rounded-xl text-zinc-400 hover:bg-rose-500/10 hover:text-rose-400 border border-transparent hover:border-rose-500/20 transition-all duration-200"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 flex w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 gap-6">
        {/* Sidebar Nav (Suppressed completely during Guest View §13.4) */}
        {!isGuestView && (
          <aside
            className={cn(
              'w-64 flex-shrink-0 flex-col gap-1 sm:flex transition-all',
              mobileMenuOpen ? 'fixed inset-y-16 left-0 z-40 bg-zinc-950 p-4 border-r border-white/10 flex shadow-2xl' : 'hidden sm:flex'
            )}
          >
            <div className="space-y-1">
              <span className="px-3 text-[11px] font-bold uppercase tracking-wider text-zinc-500 block mb-2">Support & Tickets</span>
              <a
                href="/tickets"
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all',
                  pathname?.startsWith('/tickets') ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-md' : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                )}
              >
                <FolderDot className="w-4 h-4 text-indigo-400" />
                <span>Ticket Hub</span>
              </a>

              <a
                href="/shared-with-me"
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all',
                  pathname?.startsWith('/shared-with-me') ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                )}
              >
                <Share2 className="w-4 h-4 text-cyan-400" />
                <span>Partner Shared Items</span>
              </a>
            </div>

            {/* Admin & Settings Section (§7.5 Role-Aware Navigation) */}
            {isAdmin && (
              <div className="pt-6 space-y-1 border-t border-white/5 mt-4">
                <span className="px-3 text-[11px] font-bold uppercase tracking-wider text-zinc-500 block mb-2">Org Management (§5)</span>
                <a
                  href="/settings/organization"
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all',
                    pathname === '/settings/organization' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                  )}
                >
                  <Building2 className="w-4 h-4 text-emerald-400" />
                  <span>Org Lifecycle</span>
                </a>
                <a
                  href="/settings/members"
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all',
                    pathname === '/settings/members' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                  )}
                >
                  <Users className="w-4 h-4 text-amber-400" />
                  <span>Members & Invites</span>
                </a>
                <a
                  href="/settings/feature-flags"
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all',
                    pathname === '/settings/feature-flags' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                  )}
                >
                  <Sliders className="w-4 h-4 text-purple-400" />
                  <span>Feature Flags</span>
                </a>
                <a
                  href="/settings/connections"
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all',
                    pathname === '/settings/connections' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                  )}
                >
                  <Shield className="w-4 h-4 text-blue-400" />
                  <span>Cross-Org Connections</span>
                </a>
              </div>
            )}
          </aside>
        )}

        {/* Active Page Component */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>

      {/* Standard Logout / Logout-Everywhere Confirmation Dialog (§4.5) */}
      <ConfirmDialog
        isOpen={showLogoutAllConfirm}
        onClose={() => setShowLogoutAllConfirm(false)}
        onConfirm={handleLogoutAll}
        title="Session Termination (§4.5)"
        message="Would you like to terminate active sessions across ALL devices and browsers? This prevents unauthorized token replays and purges cache across both dashboards."
        confirmLabel="Log out of all devices"
        variant="destructive"
        isLoading={isLoggingOut}
      />
    </div>
  );
}
