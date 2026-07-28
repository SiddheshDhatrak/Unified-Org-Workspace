import React from 'react';
import { LucideIcon, FolderOpen } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
}

/**
 * Parameterized EmptyState primitive (§19.2)
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = FolderOpen,
  title,
  subtitle,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-white/15 bg-zinc-900/30 backdrop-blur-sm max-w-lg mx-auto my-6">
      <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4 shadow-[0_0_15px_rgba(99,102,241,0.15)]">
        <Icon className="w-7 h-7 text-indigo-400" />
      </div>
      <h3 className="text-base font-bold text-white mb-1">{title}</h3>
      <p className="text-sm text-zinc-400 mb-6 max-w-sm">{subtitle}</p>
      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction} className="shadow-md shadow-indigo-500/20">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
