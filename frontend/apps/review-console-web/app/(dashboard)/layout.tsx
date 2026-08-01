'use client';
import React from 'react';
import { useSession, useOrgContext } from '@workspace/hooks';
import { OrgSwitcher, NotificationBell, GuestBanner, ConfirmDialog, useTheme, cn } from '@workspace/ui-kit';
import { ApiError } from '@workspace/api-client';
import {
  GitPullRequest,
  LifeBuoy,
  LogOut,
  FileCheck2,
  Menu,
  X,
  Database,
  Sun,
  Moon
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { auth } from '@workspace/api-client';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, isLoading, error } = useSession();
  const { isGuestView, orgRole } = useOrgContext();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const isNewSession = !sessionStorage.getItem('tab_session_active');
      if (isNewSession) {
        sessionStorage.setItem('tab_session_active', 'true');
        if (pathname !== '/prs') {
          router.replace('/prs');
        }
      }
    }
  }, [pathname, router]);

  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [showLogoutAllConfirm, setShowLogoutAllConfirm] = React.useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg)' }}>
        <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--accent)' }} />
      </div>
    );
  }

  if (error) {
    const isAuthError = error instanceof ApiError && (error.status === 401 || error.status === 403);
    if (isAuthError) {
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = `/login?from=${encodeURIComponent(window.location.pathname)}`;
      }
      return null;
    }
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6" style={{ backgroundColor: 'var(--bg)', color: 'var(--text-secondary)' }}>
        <p className="text-base font-medium" style={{ color: 'var(--text-primary)' }}>Unable to connect</p>
        <p className="text-sm text-center max-w-sm">Could not reach the backend API. Make sure the server is running.</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg)', color: 'var(--text-primary)' }}>
      <GuestBanner />

      <header className="sticky top-0 z-30 h-14 w-full border-b flex items-center justify-between px-4 sm:px-6" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="sm:hidden p-1.5 rounded-lg hover:bg-[var(--surface-hover)]"
            style={{ color: 'var(--text-secondary)' }}
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: 'var(--accent)' }}>
              <GitPullRequest className="w-4 h-4" />
            </div>
            <div className="hidden sm:block">
              <span className="text-sm font-semibold block leading-tight text-[var(--text-primary)]">Review Console</span>
            </div>
          </div>

          <div className="hidden sm:flex items-center pl-3 border-l" style={{ borderColor: 'var(--border)' }}>
            <OrgSwitcher />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <NotificationBell />

          <button
            onClick={toggleTheme}
            className="flex items-center justify-center w-9 h-9 rounded-lg border transition-colors"
            style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)', color: 'var(--text-secondary)' }}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>

          <a
            href={process.env.NEXT_PUBLIC_SUPPORT_HUB_URL || "http://localhost:3000/tickets"}
            target="_blank"
            rel="noreferrer"
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
          >
            <LifeBuoy className="w-3.5 h-3.5" />
            Support Hub
          </a>

          <div className="flex items-center gap-2 pl-3 ml-1 border-l" style={{ borderColor: 'var(--border)' }}>
            <div 
              className="hidden sm:flex items-center justify-center w-8 h-8 rounded-full bg-[var(--bg-tertiary)] border border-[var(--border)] text-xs font-bold text-[var(--text-secondary)] uppercase cursor-help"
              title={`${session?.user.fullName} • ${orgRole || 'User'}`}
            >
              {session?.user.fullName?.[0] || 'U'}
            </div>
            <button
              onClick={() => setShowLogoutAllConfirm(true)}
              className="p-2 rounded-lg hover:bg-[var(--surface-hover)] transition-colors"
              style={{ color: 'var(--text-tertiary)' }}
              title="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 gap-6">
        {!isGuestView && (
          <aside className={cn(
            'w-52 shrink-0 flex-col gap-0.5 sm:flex transition-all',
            mobileMenuOpen ? 'fixed inset-y-14 left-0 z-40 p-4 border-r flex' : 'hidden sm:flex'
          )} style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)' }}>
            
            <p className="px-3 text-[11px] font-medium mb-2 mt-2" style={{ color: 'var(--text-tertiary)' }}>Review Engine</p>
            <a
              href="/prs"
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                pathname?.startsWith('/prs') ? 'bg-[var(--accent-light)]' : 'hover:bg-[var(--surface-hover)]'
              )}
              style={{ color: pathname?.startsWith('/prs') ? 'var(--accent-text)' : 'var(--text-secondary)' }}
            >
              <FileCheck2 className="w-4 h-4" />
              <span>Pull Requests</span>
            </a>

            <div className="pt-5 mt-5 border-t space-y-0.5" style={{ borderColor: 'var(--border)' }}>
              <p className="px-3 text-[11px] font-medium mb-2" style={{ color: 'var(--text-tertiary)' }}>Compliance & Logs</p>
              <a
                href="/audit"
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  pathname?.startsWith('/audit') ? 'bg-[var(--accent-light)]' : 'hover:bg-[var(--surface-hover)]'
                )}
                style={{ color: pathname?.startsWith('/audit') ? 'var(--accent-text)' : 'var(--text-secondary)' }}
              >
                <Database className="w-4 h-4" />
                <span>Unified Audit</span>
              </a>
            </div>
          </aside>
        )}

        <main className="flex-1 min-w-0">{children}</main>
      </div>

      <ConfirmDialog
        isOpen={showLogoutAllConfirm}
        onClose={() => setShowLogoutAllConfirm(false)}
        onConfirm={async () => { await auth.logoutAll(); window.location.href = process.env.NEXT_PUBLIC_SUPPORT_HUB_URL ? `${process.env.NEXT_PUBLIC_SUPPORT_HUB_URL}/login` : 'http://localhost:3000/login'; }}
        title="Session Termination"
        message="Terminate active sessions across ALL devices and dashboards?"
        confirmLabel="Log out everywhere"
        variant="destructive"
      />
    </div>
  );
}
