import React from 'react';
import { cn } from '../utils';

export type StatusValue =
  | 'OPEN' | 'IN_PROGRESS' | 'BLOCKED' | 'RESOLVED' | 'CLOSED'
  | 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED' | 'MERGED'
  | 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  | 'ACTIVE' | 'SUSPENDED' | 'REMOVED' | 'PENDING'
  | string;

interface BadgeProps {
  status: StatusValue;
  className?: string;
}

const BADGE_STYLES: Record<string, string> = {
  OPEN: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
  IN_PROGRESS: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
  IN_REVIEW: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
  MEDIUM: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
  PENDING: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
  BLOCKED: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400',
  REJECTED: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400',
  HIGH: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400',
  URGENT: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400',
  SUSPENDED: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400',
  REMOVED: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400',
  RESOLVED: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
  APPROVED: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
  ACTIVE: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
  LOW: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
  CLOSED: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
  DRAFT: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
  MERGED: 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400',
};

export const Badge: React.FC<BadgeProps> = ({ status, className }) => {
  const normalized = String(status).toUpperCase();
  const style = BADGE_STYLES[normalized] || 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400';

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium tracking-wide',
        style,
        className
      )}
    >
      {normalized.replace(/_/g, ' ')}
    </span>
  );
};
