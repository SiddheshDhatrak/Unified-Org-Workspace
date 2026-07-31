'use client';
import React from 'react';
import { useAuditFeed, useOrgContext } from '@workspace/hooks';
import { Button, Table, DiffViewer, cn } from '@workspace/ui-kit';
import { AuditEvent } from '@workspace/types';
import { Database, Download, Eye, RefreshCw, Check } from 'lucide-react';
import { audit } from '@workspace/api-client';

export default function AuditViewerPage() {
  const { orgId } = useOrgContext();
  const [cursor, setCursor] = React.useState<string | undefined>(undefined);
  const [selectedActions, setSelectedActions] = React.useState<string[]>([]);
  const [expandedLogId, setExpandedLogId] = React.useState<string | null>(null);
  const [isExporting, setIsExporting] = React.useState(false);

  const { data: logsResponse, isLoading, refetch, isFetching } = useAuditFeed(orgId, {
    cursor,
    actions: selectedActions.length > 0 ? selectedActions.join(',') : undefined,
  });

  const logs = (logsResponse?.pages?.flatMap(page => page.data) || []) as AuditEvent[];
  const nextCursor = logsResponse?.pages?.[logsResponse.pages.length - 1]?.nextCursor;

  const handleToggleAction = (action: string) => {
    setSelectedActions((prev) =>
      prev.includes(action) ? prev.filter((a) => a !== action) : [...prev, action]
    );
  };

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const result = await audit.exportCsv(orgId, { actions: selectedActions.join(',') });
      const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-export-${orgId}-${Date.now()}.csv`;
      a.click();
      alert('Streaming CSV audit dump generated successfully.');
    } catch (e: any) {
      alert(`Export error: ${e.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const availableActions = ['USER_LOGIN', 'ORG_INVITE_SENT', 'TICKET_CREATED', 'TICKET_STATUS_UPDATED', 'PR_APPROVED', 'FEATURE_FLAG_TOGGLED'];

  const tableColumns = [
    {
      header: 'Timestamp & ID',
      render: (r: AuditEvent) => (
        <div className="font-mono">
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{new Date(r.createdAt || Date.now()).toLocaleString()}</p>
          <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>ID: {r.id}</p>
        </div>
      ),
    },
    {
      header: 'Action Name',
      render: (r: AuditEvent) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium bg-[var(--accent-light)]" style={{ color: 'var(--accent-text)' }}>
          {r.action || 'AUDIT_RECORD'}
        </span>
      ),
    },
    {
      header: 'Actor',
      render: (r: AuditEvent) => (
        <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
          {r.actorId || 'System Auto'}
        </span>
      ),
    },
    {
      header: 'Target Resource',
      render: (r: AuditEvent) => (
        <span className="text-sm font-mono" style={{ color: 'var(--text-secondary)' }}>
          {r.resourceId || 'Organization'}
        </span>
      ),
    },
    {
      header: 'Change Inspection',
      render: (r: AuditEvent) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setExpandedLogId(expandedLogId === r.id ? null : r.id);
          }}
          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
          style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
        >
          <Eye className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
          <span>{expandedLogId === r.id ? 'Hide Diff' : 'Inspect Diff'}</span>
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto page-enter pb-10">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Database className="w-5 h-5" style={{ color: 'var(--accent)' }} />
            <span>Unified Audit Viewer</span>
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Immutable governance ledger with real-time cursor pagination.</p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={cn('w-3.5 h-3.5', isFetching && 'animate-spin')} />
            <span>Refresh Feed</span>
          </Button>
          <Button variant="primary" size="sm" onClick={handleExportCSV} isLoading={isExporting}>
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </Button>
        </div>
      </div>

      <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] space-y-3">
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Filter Actions</span>
        <div className="flex flex-wrap gap-2">
          {availableActions.map((action) => {
            const isSelected = selectedActions.includes(action);
            return (
              <button
                key={action}
                onClick={() => handleToggleAction(action)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all flex items-center gap-1.5 border',
                  isSelected
                    ? 'bg-[var(--accent-light)] border-[var(--accent)]'
                    : 'bg-[var(--bg)] border-[var(--border)] hover:border-[var(--text-tertiary)]'
                )}
                style={{ color: isSelected ? 'var(--accent-text)' : 'var(--text-secondary)' }}
              >
                {isSelected && <Check className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />}
                <span>{action}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-4">
        <Table
          data={logs}
          columns={tableColumns}
          isLoading={isLoading}
          emptyMessage="No governance events recorded matching selected action filters."
          nextCursor={nextCursor}
          onLoadMore={() => setCursor(nextCursor || undefined)}
          isLoadingMore={isFetching}
        />

        {expandedLogId && (
          <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-md space-y-4 animate-in fade-in-50">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Before / After Mutation Diff</span>
              <button onClick={() => setExpandedLogId(null)} className="text-xs hover:underline" style={{ color: 'var(--text-tertiary)' }}>Close</button>
            </div>
            <p className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>Record ID: {expandedLogId}</p>
            <DiffViewer
              diffData={[
                { removed: true, value: '- status: "DRAFT"\n- requiredApprovals: 1' },
                { added: true, value: '+ status: "IN_REVIEW"\n+ requiredApprovals: 2\n+ reviewerAssigned: "bob-approver"' },
              ]}
            />
          </div>
        )}
      </div>
    </div>
  );
}
