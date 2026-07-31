'use client';
import React from 'react';
import { usePullRequests, useOrgContext } from '@workspace/hooks';
import { Button, Badge, DigestCard, Table, EmptyState, Modal, RoleGate, Input, Textarea, cn } from '@workspace/ui-kit';
import { PullRequest, PRStatus } from '@workspace/types';
import { Plus, LayoutGrid, ListFilter, Search, GitPullRequest, CheckCircle2, XCircle, Clock, GitMerge } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { prs } from '@workspace/api-client';

const PR_COLUMNS: { status: PRStatus; label: string; }[] = [
  { status: 'DRAFT', label: 'Draft' },
  { status: 'IN_REVIEW', label: 'In Review' },
  { status: 'APPROVED', label: 'Approved' },
  { status: 'REJECTED', label: 'Changes Requested' },
  { status: 'MERGED', label: 'Merged' },
];

function Toast({ message, type, onDismiss }: { message: string; type: 'error' | 'success'; onDismiss: () => void }) {
  React.useEffect(() => { const t = setTimeout(onDismiss, 4000); return () => clearTimeout(t); }, [onDismiss]);
  return (
    <div className={cn(
      'fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-lg border shadow-xl text-sm font-medium toast-enter max-w-sm transition-all',
      type === 'error'
        ? 'bg-red-50 text-red-900 border-red-200 dark:bg-red-950/80 dark:border-red-900/50 dark:text-red-200'
        : 'bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/80 dark:border-emerald-900/50 dark:text-emerald-200'
    )}>
      {type === 'error' ? <XCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
      <span className="flex-1">{message}</span>
      <button onClick={onDismiss} className="opacity-50 hover:opacity-100">✕</button>
    </div>
  );
}

function ApprovalBar({ approved, required }: { approved: number; required: number }) {
  const pct = Math.min((approved / required) * 100, 100);
  const done = approved >= required;
  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="flex-1 h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', done ? 'bg-emerald-500' : 'bg-amber-500')}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={cn('text-[11px] font-medium shrink-0', done ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400')}>
        {approved}/{required}
      </span>
    </div>
  );
}

export default function PRsPage() {
  const { orgId, isGuestView } = useOrgContext();
  const [viewMode, setViewMode] = React.useState<'list' | 'board'>('board');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [toast, setToast] = React.useState<{ message: string; type: 'error' | 'success' } | null>(null);

  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [requiredApprovals, setRequiredApprovals] = React.useState('2');
  const [isCreating, setIsCreating] = React.useState(false);

  const router = useRouter();
  const { data: prsResponse, isLoading, refetch } = usePullRequests(orgId, {
    q: searchQuery || undefined,
  });

  const prList = (Array.isArray(prsResponse) ? prsResponse : prsResponse?.data || []) as PullRequest[];

  // Stats
  const inReviewCount = prList.filter(p => p.status === 'IN_REVIEW').length;
  const approvedCount = prList.filter(p => p.status === 'APPROVED').length;
  const mergedCount = prList.filter(p => p.status === 'MERGED').length;
  const draftCount = prList.filter(p => p.status === 'DRAFT').length;

  const showToast = (message: string, type: 'error' | 'success') => setToast({ message, type });

  const handleCreatePR = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    setIsCreating(true);
    try {
      await prs.create(orgId, { title, description, requiredApprovals: parseInt(requiredApprovals) || 1 });
      setIsCreateModalOpen(false);
      setTitle('');
      setDescription('');
      refetch();
      showToast('Pull Request created!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Error creating PR', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const tableColumns = [
    {
      header: 'Pull Request',
      render: (pr: PullRequest) => (
        <div className="flex items-start gap-3">
          <GitPullRequest className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'var(--accent)' }} />
          <div>
            <p className="font-medium hover:underline" style={{ color: 'var(--text-primary)' }}>{pr.title}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>by {pr.author?.fullName || 'Developer'} · v{pr._count?.versions || 1}</p>
          </div>
        </div>
      ),
    },
    { header: 'Status', render: (pr: PullRequest) => <Badge status={pr.status} /> },
    {
      header: 'Approvals',
      render: (pr: PullRequest) => {
        const approved = (pr.reviewers || []).filter(r => r.decision === 'APPROVED').length;
        return <ApprovalBar approved={approved} required={pr.requiredApprovals || 1} />;
      },
    },
  ];

  return (
    <div className="space-y-6 page-enter pb-10">
      {toast && <Toast {...toast} onDismiss={() => setToast(null)} />}

      <DigestCard />

      {!isLoading && prList.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'In Review', count: inReviewCount, icon: Clock },
            { label: 'Approved', count: approvedCount, icon: CheckCircle2 },
            { label: 'Merged', count: mergedCount, icon: GitMerge },
            { label: 'Draft', count: draftCount, icon: GitPullRequest },
          ].map(({ label, count, icon: Icon }) => (
            <div key={label} className="flex items-center gap-3 p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[var(--accent-light)] text-[var(--accent-text)] shrink-0">
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xl font-bold leading-none" style={{ color: 'var(--text-primary)' }}>{count}</p>
                <p className="text-xs font-medium mt-1" style={{ color: 'var(--text-tertiary)' }}>{label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
        <div className="relative flex-1 max-w-xs w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search pull requests..."
            className="w-full h-9 pl-9 pr-3 text-sm rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-all"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex rounded-lg bg-[var(--bg-tertiary)] p-1 border border-[var(--border)]">
            {[
              { mode: 'board' as const, Icon: LayoutGrid, label: 'Board' },
              { mode: 'list' as const, Icon: ListFilter, label: 'List' },
            ].map(({ mode, Icon, label }) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                  viewMode === mode
                    ? 'bg-[var(--surface)] shadow-sm text-[var(--text-primary)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>

          {!isGuestView && (
            <Button size="sm" variant="primary" onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="w-4 h-4" />
              New PR
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        viewMode === 'board' ? (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {PR_COLUMNS.map(col => (
              <div key={col.status} className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-3 min-h-[420px]">
                <div className="h-4 w-20 rounded shimmer mb-4" />
                {[1, 2].map(i => <div key={i} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 mb-3 h-24 shimmer" />)}
              </div>
            ))}
          </div>
        ) : (
          <Table data={[]} columns={tableColumns} isLoading />
        )
      ) : prList.length === 0 ? (
        <EmptyState
          title="No Pull Requests"
          subtitle="All PRs have been merged or the queue is empty."
          actionLabel={!isGuestView ? 'Create PR' : undefined}
          onAction={!isGuestView ? () => setIsCreateModalOpen(true) : undefined}
        />
      ) : viewMode === 'list' ? (
        <Table data={prList} columns={tableColumns} onRowClick={(pr) => router.push(`/prs/${pr.id}`)} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {PR_COLUMNS.map((col) => {
            const colPRs = prList.filter(p => p.status === col.status);
            return (
              <div
                key={col.status}
                className="flex flex-col rounded-xl bg-[var(--bg-secondary)] min-h-[500px] border border-[var(--border)]"
              >
                <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{col.label}</span>
                  <span className="px-2 py-0.5 rounded-md bg-[var(--bg-tertiary)] text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                    {colPRs.length}
                  </span>
                </div>

                <div className="flex-1 p-3 space-y-3 overflow-y-auto">
                  {colPRs.map((pr) => {
                    const approved = (pr.reviewers || []).filter(r => r.decision === 'APPROVED').length;
                    const required = pr.requiredApprovals || 1;
                    return (
                      <div
                        key={pr.id}
                        onClick={() => router.push(`/prs/${pr.id}`)}
                        className="group flex flex-col gap-3 p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-[var(--accent)]"
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <GitPullRequest className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
                          <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>v{pr._count?.versions || 1}</span>
                        </div>
                        <p className="text-sm font-medium leading-snug" style={{ color: 'var(--text-primary)' }}>
                          {pr.title}
                        </p>
                        <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>by {pr.author?.fullName || 'Author'}</p>
                        <ApprovalBar approved={approved} required={required} />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Submit Pull Request">
        <form onSubmit={handleCreatePR} className="space-y-4 mt-2">
          <Input label="PR Title" value={title} onChange={e => setTitle(e.target.value)} required placeholder="feat: migrate database layer" />
          <Textarea label="Change Summary" value={description} onChange={e => setDescription(e.target.value)} required placeholder="Detail impacted files..." />
          <Input label="Required Approvals" type="number" min="1" max="5" value={requiredApprovals} onChange={e => setRequiredApprovals(e.target.value)} />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={isCreating}>Create Draft PR</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
