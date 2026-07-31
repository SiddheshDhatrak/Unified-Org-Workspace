import React from 'react';
import * as Diff from 'diff';
import { cn } from '../utils';

interface DiffViewerProps {
  diffData?: Array<{ field?: string; count?: number; added?: boolean; removed?: boolean; value: string }>;
  oldText?: string;
  newText?: string;
  className?: string;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({ diffData, oldText = '', newText = '', className }) => {
  const computedDiff = React.useMemo(() => {
    if (diffData && diffData.length > 0) return diffData;
    return Diff.diffLines(oldText, newText);
  }, [diffData, oldText, newText]);

  return (
    <div className={cn('w-full rounded-lg border border-[var(--border)] overflow-hidden font-mono text-xs', className)}>
      <div className="overflow-x-auto max-h-[500px]">
        {computedDiff.map((part, index) => {
          const lines = part.value.replace(/\n$/, '').split('\n');
          return (
            <div
              key={index}
              className={cn(
                part.added && 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-300',
                part.removed && 'bg-red-50 dark:bg-red-500/10 text-red-800 dark:text-red-300 line-through opacity-70',
                !part.added && !part.removed && 'text-[var(--text-secondary)]'
              )}
            >
              {lines.map((line, lIdx) => (
                <div key={lIdx} className="flex items-start px-4 py-0.5 hover:bg-[var(--surface-hover)]">
                  <span className="w-6 select-none shrink-0 text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                    {part.added ? '+' : part.removed ? '−' : ' '}
                  </span>
                  <span className="whitespace-pre-wrap leading-relaxed flex-1">{line || ' '}</span>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};
