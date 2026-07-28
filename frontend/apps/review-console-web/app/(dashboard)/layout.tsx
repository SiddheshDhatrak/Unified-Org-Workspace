'use client';
import React from 'react';
import { useSession, useOrgContext } from '@workspace/hooks';
import { OrgSwitcher, NotificationBell, GuestBanner, Button, ConfirmDialog, cn } from '@workspace/ui-kit';
import {
  GitPullRequest,
  ShieldAlert,
  LifeBuoy,
  LogOut,
  FileCheck2,
  Menu,
  X,
  Database,
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { auth } from '@workspace/api-client';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, isLoading, error } = useSession();
  const { isGuestView, orgRole } = useOrgContext();
  const pathname = usePathname();

  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [showLogoutAllConfirm, setShowLogoutAllConfirm] = React.useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center text-zinc-400 gap-3">
        <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold tracking-wider uppercase animate-pulse">Hydrating Review Console session...</p>
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
          className="mt-2 px-5 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-300 text-sm font-bold transition-all"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#090D16] text-zinc-100 selection:bg-purple-500/30">
      <GuestBanner />

      <header className="sticky top-0 z-30 h-16 w-full border-b border-white/10 bg-zinc-950/80 backdrop-blur-xl flex items-center justify-between px-4 sm:px-6 shadow-md">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="sm:hidden p-2 rounded-xl text-zinc-400 hover:bg-white/10 hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-500 via-indigo-500 to-cyan-400 p-[1px] shadow-lg shadow-purple-500/20">
              <div className="w-full h-full bg-zinc-950 rounded-xl flex items-center justify-center text-purple-400 font-bold">
                <GitPullRequest className="w-5 h-5" />
              </div>
            </div>
            <div>
              <span className="text-base font-extrabold tracking-tight text-white block leading-none">Review & Audit Console</span>
              <span className="text-[10px] font-mono text-zinc-400 tracking-wider uppercase">Dashboard 2 (§11)</span>
            </div>
          </div>

          <div className="hidden sm:flex items-center pl-4 border-l border-white/10">
            <OrgSwitcher />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <NotificationBell />

          {/* Quick Jump back to Support Hub (§1.1 / §18.2) */}
          <a
            href="http://localhost:3000/tickets"
            target="_blank"
            rel="noreferrer"
            className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-bold transition-all shadow-[0_0_15px_rgba(99,102,241,0.15)]"
          >
            <LifeBuoy className="w-3.5 h-3.5" />
            <span>Support Hub</span>
          </a>

          <div className="flex items-center gap-2 pl-2 border-l border-white/10">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-white leading-none">{session?.user.fullName}</p>
              <p className="text-[10px] text-zinc-500 uppercase font-mono mt-0.5">{orgRole || 'User'}</p>
            </div>
            <button
              onClick={() => setShowLogoutAllConfirm(true)}
              title="Terminate Sessions (§4.5)"
              className="p-2 rounded-xl text-zinc-400 hover:bg-rose-500/10 hover:text-rose-400 transition-all"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 gap-6">
        {!isGuestView && (
          <aside className="w-64 flex-shrink-0 flex-col gap-1 hidden sm:flex">
            <span className="px-3 text-[11px] font-bold uppercase tracking-wider text-zinc-500 block mb-2">Review Engine</span>
            <a
              href="/prs"
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all',
                pathname?.startsWith('/prs') ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 shadow-md' : 'text-zinc-400 hover:bg-white/5 hover:text-white'
              )}
            >
              <FileCheck2 className="w-4 h-4 text-purple-400" />
              <span>PR Review Console</span>
            </a>

            <div className="pt-6 space-y-1 border-t border-white/5 mt-4">
              <span className="px-3 text-[11px] font-bold uppercase tracking-wider text-zinc-500 block mb-2">Compliance & Logs</span>
              <a
                href="/audit"
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all',
                  pathname?.startsWith('/audit') ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 shadow-md' : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                )}
              >
                <Database className="w-4 h-4 text-cyan-400" />
                <span>Unified Audit Viewer (§14)</span>
              </a>
            </div>
          </aside>
        )}

        <main className="flex-1 min-w-0">{children}</main>
      </div>

      <ConfirmDialog
        isOpen={showLogoutAllConfirm}
        onClose={() => setShowLogoutAllConfirm(false)}
        onConfirm={async () => { await auth.logoutAll(); window.location.href = 'http://localhost:3000/login'; }}
        title="Session Termination (§4.5)"
        message="Terminate active sessions across ALL devices and dashboards?"
        confirmLabel="Log out of all devices"
        variant="destructive"
      />
    </div>
  );
}
