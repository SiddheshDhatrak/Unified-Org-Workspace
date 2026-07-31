import React from 'react';
import { useOrgContext } from '@workspace/hooks';
import { ShieldAlert, Lock } from 'lucide-react';

export const GuestBanner: React.FC = () => {
  const { isGuestView, partnerOrgName, orgName } = useOrgContext();
  if (!isGuestView) return null;

  return (
    <div className="w-full bg-amber-50 dark:bg-amber-500/10 border-b border-amber-200 dark:border-amber-500/20 px-6 py-2.5 flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
        <p className="text-sm text-amber-800 dark:text-amber-200">
          <span className="font-semibold">Guest View</span> — Viewing as partner from{' '}
          <strong>{partnerOrgName || 'partner org'}</strong> inside <strong>{orgName}</strong>
        </p>
      </div>
      <div className="flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-300">
        <Lock className="w-3 h-3" /> Read & Comment Only
      </div>
    </div>
  );
};
