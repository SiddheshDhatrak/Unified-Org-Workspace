import React from 'react';
import * as Diff from 'diff';
import { cn } from '../utils';
import { GitCommit, Plus, Minus } from 'lucide-react';

interface DiffViewerProps {
  diffData?: Array<{ field?: string; count?: number; added?: boolean; removed?: boolean; value: string }>;
  oldText?: string;
  newText?: string;
  className?: string;
}

/**
 * Diff Viewer Component (§12.2)
 * Renders structured diffs with vivid green/red added and removed span highlights.
 */
export const DiffViewer: React.FC<DiffViewerProps> = ({ diffData, oldText = '', newText = '', className }) => {
  const [viewMode, setViewMode] = React.useState<'inline' | 'split'>('inline');

  const computedDiff = React.useMemo(() => {
    if (diffData && diffData.length > 0) return diffData;
    return Diff.diffLines(oldText, newText);
  }, [diffData, oldText, newText]);

  return (
    <div className={cn('w-full rounded-xl border border-white/10 bg-zinc-950/90 shadow-xl overflow-hidden font-mono text-xs', className)}>
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 bg-zinc-900/80">
        <div className="flex items-center gap-2">
          <GitCommit className="w-4 h-4 text-indigo-400" />
          <span className="font-bold text-zinc-200">Version Diff Inspection (§12.2)</span>
        </div>
        <div className="flex rounded-lg bg-zinc-800 p-0.5 border border-white/10">
          <button
            onClick={() => setViewMode('inline')}
            className={cn('px-2.5 py-1 rounded-md transition-colors text-[11px] font-semibold', viewMode === 'inline' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-white')}
          >
            Inline
          </button>
          <button
            onClick={() => setViewMode('split')}
            className={cn('px-2.5 py-1 rounded-md transition-colors text-[11px] font-semibold', viewMode === 'split' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-white')}
          >
            Split
          </button>
        </div>
      </div>

      <div className="divide-y divide-white/5 overflow-x-auto max-h-[500px]">
        {computedDiff.map((part, index) => {
          const lines = part.value.replace(/\n$/, '').split('\n');
          const isAdded = part.added;
          const isRemoved = part.removed;

          return (
            <div
              key={index}
              className={cn(
                'py-1 transition-colors duration-150',
                isAdded && 'bg-emerald-500/15 text-emerald-300 font-semibold border-l-4 border-emerald-500',
                isRemoved && 'bg-rose-500/15 text-rose-300 line-through opacity-80 border-l-4 border-rose-500',
                !isAdded && !isRemoved && 'text-zinc-400'
              )}
            >
              {lines.map((line, lIdx) => (
                <div key={lIdx} className="flex items-start px-4 py-0.5 hover:bg-white/5">
                  <span className="w-8 select-none text-zinc-600 flex-shrink-0 flex items-center">
                    {isAdded && <Plus className="w-3.5 h-3.5 text-emerald-400" />}
                    {isRemoved && <Minus className="w-3.5 h-3.5 text-rose-400" />}
                  </span>
                  <span className="whitespace-pre-wrap font-mono leading-relaxed flex-1">{line || ' '}</span>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};
