import React from 'react';
import { cn } from '../utils';
import { CircleDot, CheckCircle2, AlertCircle, Clock, Ban, ShieldCheck, GitPullRequest } from 'lucide-react';

export type StatusValue =
  | 'OPEN' | 'IN_PROGRESS' | 'BLOCKED' | 'RESOLVED' | 'CLOSED' // Tickets
  | 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED' | 'MERGED' // PRs
  | 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' // Priority
  | 'ACTIVE' | 'SUSPENDED' | 'REMOVED' | 'PENDING' // Lifecycle
  | string;

interface BadgeProps {
  status: StatusValue;
  className?: string;
}

/**
 * Standardized Status Color Taxonomy (§19.1 / §19.3 / §23)
 * Never relies on color alone; includes matching descriptive Lucide icon!
 */
export const Badge: React.FC<BadgeProps> = ({ status, className }) => {
  const normalized = String(status).toUpperCase();

  let styles = 'bg-zinc-800 text-zinc-300 border-zinc-700';
  let Icon = CircleDot;

  switch (normalized) {
    // Open = Blue
    case 'OPEN':
      styles = 'bg-blue-500/15 text-blue-400 border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.15)]';
      Icon = CircleDot;
      break;
    // In Progress & In Review = Amber
    case 'IN_PROGRESS':
    case 'IN_REVIEW':
    case 'MEDIUM':
    case 'PENDING':
      styles = 'bg-amber-500/15 text-amber-400 border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.15)]';
      Icon = Clock;
      break;
    // Blocked & Rejected & High/Urgent = Red
    case 'BLOCKED':
    case 'REJECTED':
    case 'HIGH':
    case 'URGENT':
    case 'SUSPENDED':
    case 'REMOVED':
      styles = 'bg-rose-500/15 text-rose-400 border-rose-500/30 shadow-[0_0_10px_rgba(244,63,94,0.15)]';
      Icon = AlertCircle;
      break;
    // Resolved & Approved & Active = Green
    case 'RESOLVED':
    case 'APPROVED':
    case 'ACTIVE':
    case 'LOW':
      styles = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.15)]';
      Icon = CheckCircle2;
      break;
    // Closed & Draft = Gray
    case 'CLOSED':
    case 'DRAFT':
      styles = 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30';
      Icon = Ban;
      break;
    // Merged = Purple (§19.3)
    case 'MERGED':
      styles = 'bg-purple-500/15 text-purple-400 border-purple-500/30 shadow-[0_0_12px_rgba(168,85,247,0.25)]';
      Icon = GitPullRequest;
      break;
    default:
      styles = 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30';
      Icon = ShieldCheck;
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border tracking-wide transition-all duration-200',
        styles,
        className
      )}
    >
      <Icon className="w-3.5 h-3.5 flex-shrink-0 animate-pulse" style={{ animationDuration: '3s' }} />
      <span>{normalized.replace(/_/g, ' ')}</span>
    </span>
  );
};
