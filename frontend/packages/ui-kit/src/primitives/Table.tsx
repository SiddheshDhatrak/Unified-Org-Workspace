import React from 'react';
import { cn } from '../utils';
import { Button } from './Button';

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

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3.5">
          <div className={cn('h-3 rounded shimmer', i === 0 ? 'w-40' : 'w-20')} />
        </td>
      ))}
    </tr>
  );
}

export function Table<T extends Record<string, any>>({
  data, columns, isLoading = false, onRowClick, nextCursor, onLoadMore,
  isLoadingMore = false, emptyMessage = 'No records found.', className,
}: TableProps<T>) {
  return (
    <div className={cn('w-full space-y-3', className)}>
      <div className="w-full overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--surface)]"
        style={{ boxShadow: 'var(--shadow)' }}
      >
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[var(--border)]">
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={cn('px-4 py-3 text-xs font-medium tracking-wide', col.className)}
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-light)] text-sm">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={columns.length} />)
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, rowIdx) => (
                <tr
                  key={rowIdx}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    'transition-colors duration-100',
                    onRowClick && 'cursor-pointer hover:bg-[var(--surface-hover)]'
                  )}
                >
                  {columns.map((col, colIdx) => (
                    <td key={colIdx} className={cn('px-4 py-3.5 whitespace-nowrap', col.className)}>
                      {col.render ? col.render(row) : (row[col.accessorKey as keyof T] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {nextCursor && (
        <div className="flex justify-center">
          <Button variant="secondary" size="sm" onClick={onLoadMore} isLoading={isLoadingMore}>Load more</Button>
        </div>
      )}
    </div>
  );
}
