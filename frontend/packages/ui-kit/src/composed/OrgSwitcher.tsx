import React from 'react';
import { useSession, useSwitchOrg } from '@workspace/hooks';
import { Building2, ChevronDown, Check, RefreshCw } from 'lucide-react';
import { cn } from '../utils';

/**
 * OrgSwitcher (§4.7)
 * Dropdown listing availableOrgs from session and highlighting active org.
 * On switch: executes auth.switchOrg, refreshes session, and purges org-scoped React Query cache!
 */
export const OrgSwitcher: React.FC = () => {
  const { data: session, isLoading } = useSession();
  const switchOrgMutation = useSwitchOrg();
  const [isOpen, setIsOpen] = React.useState(false);

  if (isLoading || !session) {
    return (
      <div className="h-10 w-48 rounded-xl bg-white/5 border border-white/10 animate-pulse" />
    );
  }

  const activeOrg = session.activeOrg;
  const availableOrgs = session.availableOrgs || [];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={switchOrgMutation.isPending}
        className="flex items-center justify-between gap-3 px-3 py-2 h-10 w-52 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-white/10 text-xs font-medium text-white transition-all duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center text-white font-bold text-[10px] flex-shrink-0 shadow-[0_0_8px_rgba(99,102,241,0.4)]">
            {activeOrg?.name ? activeOrg.name.charAt(0).toUpperCase() : 'O'}
          </div>
          <span className="truncate font-semibold text-zinc-100">
            {activeOrg?.name || 'Select Workspace'}
          </span>
        </div>
        {switchOrgMutation.isPending ? (
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400 flex-shrink-0" />
        ) : (
          <ChevronDown className={cn('w-4 h-4 text-zinc-400 transition-transform duration-200 flex-shrink-0', isOpen && 'rotate-180')} />
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 mt-2 w-64 rounded-2xl border border-white/10 bg-zinc-950 p-2 shadow-2xl backdrop-blur-2xl z-50 divide-y divide-white/5 animate-in fade-in-0 zoom-in-95">
            <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Your Organizations ({availableOrgs.length}) (§4.8)
            </div>
            <div className="py-1 max-h-64 overflow-y-auto space-y-1">
              {availableOrgs.map((org) => {
                const isSelected = org.id === activeOrg?.id;
                return (
                  <button
                    key={org.id}
                    onClick={() => {
                      setIsOpen(false);
                      if (!isSelected) {
                        switchOrgMutation.mutate(org.id);
                      }
                    }}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs font-medium transition-colors duration-150',
                      isSelected ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'text-zinc-300 hover:bg-white/5 hover:text-white'
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <Building2 className={cn('w-4 h-4', isSelected ? 'text-indigo-400' : 'text-zinc-500')} />
                      <div>
                        <p className="font-semibold">{org.name}</p>
                        <p className="text-[10px] text-zinc-500 uppercase font-mono">{org.orgRole}</p>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-indigo-400 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
