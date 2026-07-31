import React from 'react';
import { useSession, useSwitchOrg } from '@workspace/hooks';
import { Building2, ChevronDown, Check, Loader2 } from 'lucide-react';
import { cn } from '../utils';

export const OrgSwitcher: React.FC = () => {
  const { data: session, isLoading } = useSession();
  const switchOrgMutation = useSwitchOrg();
  const [isOpen, setIsOpen] = React.useState(false);

  if (isLoading || !session) {
    return <div className="h-9 w-44 rounded-lg shimmer" />;
  }

  const activeOrg = session.activeOrg;
  const availableOrgs = session.availableOrgs || [];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={switchOrgMutation.isPending}
        className={cn(
          'flex items-center justify-between gap-2 px-3 py-2 h-9 w-48 rounded-lg text-sm font-medium transition-colors',
          'border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)]'
        )}
        style={{ color: 'var(--text-primary)' }}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center text-white text-[10px] font-semibold shrink-0"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            {activeOrg?.name?.[0]?.toUpperCase() || 'O'}
          </div>
          <span className="truncate text-sm">{activeOrg?.name || 'Select Org'}</span>
        </div>
        {switchOrgMutation.isPending ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" style={{ color: 'var(--text-tertiary)' }} />
        ) : (
          <ChevronDown className={cn('w-3.5 h-3.5 transition-transform shrink-0', isOpen && 'rotate-180')} style={{ color: 'var(--text-tertiary)' }} />
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div
            className="absolute left-0 mt-1.5 w-56 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-1 z-50 animate-fade-up"
            style={{ boxShadow: 'var(--shadow-lg)' }}
          >
            <p className="px-3 py-2 text-[11px] font-medium" style={{ color: 'var(--text-tertiary)' }}>
              Organizations ({availableOrgs.length})
            </p>
            <div className="max-h-60 overflow-y-auto space-y-0.5">
              {availableOrgs.map((org) => {
                const isSelected = org.id === activeOrg?.id;
                return (
                  <button
                    key={org.id}
                    onClick={() => { setIsOpen(false); if (!isSelected) switchOrgMutation.mutate(org.id); }}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors text-left',
                      isSelected
                        ? 'bg-[var(--accent-light)] font-medium'
                        : 'hover:bg-[var(--surface-hover)]'
                    )}
                    style={{ color: isSelected ? 'var(--accent-text)' : 'var(--text-primary)' }}
                  >
                    <div className="flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5" style={{ color: isSelected ? 'var(--accent)' : 'var(--text-tertiary)' }} />
                      <div>
                        <p className="text-sm font-medium leading-none" style={{ color: 'var(--text-primary)' }}>{org.name}</p>
                        <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>{org.role}</p>
                      </div>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--accent)' }} />}
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
