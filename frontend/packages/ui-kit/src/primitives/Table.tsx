import React from 'react';
import { cn } from '../utils';
import { Button } from './Button';
import { Loader2 } from 'lucide-react';

interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  isLoading?: boolean;
  onRowClick?: (item: T) => void;
  nextCursor?: string | null;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
  emptyMessage?: string;
  className?: string;
}

export function Table<T extends Record<string, any>>({
  data,
  columns,
  isLoading = false,
  onRowClick,
  nextCursor,
  onLoadMore,
  isLoadingMore = false,
  emptyMessage = 'No records found.',
  className,
}: TableProps<T>) {
  return (
    <div className={cn('w-full flex flex-col space-y-4', className)}>
      <div className="w-full overflow-x-auto rounded-xl border border-white/10 bg-zinc-900/60 shadow-xl backdrop-blur-md">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 bg-white/5 text-xs font-bold uppercase tracking-wider text-zinc-400">
              {columns.map((col, idx) => (
                <th key={idx} className={cn('px-4 py-3.5', col.className)}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-sm font-medium text-zinc-200">
            {isLoading && data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-zinc-500">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
                    <span>Loading data...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-zinc-500 italic">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, rowIdx) => (
                <tr
                  key={rowIdx}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={cn(
                    'transition-colors duration-150 hover:bg-white/5',
                    onRowClick && 'cursor-pointer hover:bg-indigo-500/5'
                  )}
                >
                  {columns.map((col, colIdx) => (
                    <td key={colIdx} className={cn('px-4 py-3.5 whitespace-nowrap', col.className)}>
                      {col.render ? col.render(row) : (row[col.accessorKey as keyof T] ?? '-')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Cursor Pagination Footer (§9.6) */}
      {nextCursor && (
        <div className="flex justify-center pt-2">
          <Button variant="secondary" size="sm" onClick={onLoadMore} isLoading={isLoadingMore}>
            Load More Records
          </Button>
        </div>
      )}
    </div>
  );
}
