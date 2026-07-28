import React from 'react';
import { useOrgContext } from '@workspace/hooks';
import { ShieldAlert, Lock } from 'lucide-react';

/**
 * Cross-Org Guest Restricted Visual Mode (§13.4)
 * Unmissable amber glassmorphism banner displayed whenever active session is a share-grant!
 */
export const GuestBanner: React.FC = () => {
  const { isGuestView, partnerOrgName, orgName } = useOrgContext();

  if (!isGuestView) return null;

  return (
    <div className="w-full bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent border-b border-amber-500/30 px-6 py-3 flex items-center justify-between backdrop-blur-md shadow-lg">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.25)]">
          <ShieldAlert className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <p className="text-sm font-bold text-amber-300">
            Restricted Guest View Mode — Partner Collaboration
          </p>
          <p className="text-xs text-amber-200/80">
            You are viewing this shared item as a guest from <strong className="font-semibold text-white">{partnerOrgName || 'your partner organization'}</strong> inside <strong className="font-semibold text-white">{orgName}</strong>. You can view and comment only (§13.4).
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs font-semibold">
        <Lock className="w-3.5 h-3.5" />
        <span>Read & Comment Only</span>
      </div>
    </div>
  );
};
