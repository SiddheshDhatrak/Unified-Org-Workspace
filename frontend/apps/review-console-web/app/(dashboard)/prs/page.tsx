'use client';
import React from 'react';
import { usePRs, useOrgContext } from '@workspace/hooks';
import { Button, Input, Badge, DigestCard, Table, EmptyState, Modal, RoleGate, cn } from '@workspace/ui-kit';
import { PR, PRStatus } from '@workspace/types';
import { Plus, LayoutGrid, ListFilter, Search, GitPullRequest, CheckCircle2, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { prs } from '@workspace/api-client';

const PR_COLUMNS: { status: PRStatus; label: string; color: string }[] = [
  { status: 'DRAFT', label: 'Draft', color: 'border-zinc-500/40 bg-zinc-500/5' },
  { status: 'IN_REVIEW', label: 'In Review', color: 'border-amber-500/40 bg-amber-500/5' },
  { status: 'APPROVED', label: 'Approved', color: 'border-emerald-500/40 bg-emerald-500/5' },
  { status: 'REJECTED', label: 'Changes Requested', color: 'border-rose-500/40 bg-rose-500/5' },
  { status: 'MERGED', label: 'Merged (§19.3)', color: 'border-purple-500/40 bg-purple-500/5' },
];

export default function PRsPage() {
  const { orgId, isGuestView } = useOrgContext();
  const [viewMode, setViewMode] = React.useState<'list' | 'board'>('board');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedStatus, setSelectedStatus] = React.useState<string>('');
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);

  // New PR form
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [requiredApprovals, setRequiredApprovals] = React.useState(2);
  const [isCreating, setIsCreating] = React.useState(false);

  const router = useRouter();
  const { data: prsResponse, isLoading, refetch } = usePRs(orgId, {
    q: searchQuery || undefined,
    status: selectedStatus || undefined,
  });

  const prList = (prsResponse?.data || []) as PR[];

  const handleCreatePR = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    setIsCreating(true);
    try {
      await prs.create(orgId, { title, description, requiredApprovals });
      setIsCreateModalOpen(false);
      setTitle('');
      setDescription('');
      refetch();
    } catch (err: any) {
      alert(err.message || 'Error creating PR');
    } finally {
      setIsCreating(false);
    }
  };

  const tableColumns = [
    {
      header: 'Pull Request & Author',
      render: (pr: PR) => (
        <div className="space-y-0.5">
          <p className="font-bold text-white hover:text-purple-400 transition-colors flex items-center gap-2">
            <GitPullRequest className="w-4 h-4 text-purple-400" />
            <span>{pr.title}</span>
          </p>
          <p className="text-xs text-zinc-400">By {pr.author?.fullName || 'Developer'} — v{pr.version}</p>
        </div>
      ),
    },
    {
      header: 'Status',
      render: (pr: PR) => <Badge status={pr.status} />,
    },
    {
      header: 'N-Approvals Progress (§11.3)',
      render: (pr: PR) => {
        const approvedCount = (pr.reviews || []).filter((r) => r.verdict === 'APPROVED').length;
        const required = pr.requiredApprovals || 1;
        const isCompleted = approvedCount >= required;
        return (
          <span
            className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold border',
              isCompleted ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-zinc-800 text-amber-400 border-white/10'
            )}
          >
            <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{approvedCount} of {required} approvals (§11.3)</span>
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* AI Progress Tracker Card (§15.1) */}
      <DigestCard />

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-zinc-900/40 p-4 rounded-2xl border border-white/10 backdrop-blur-md">
        <div className="flex items-center gap-3 flex-1 w-full sm:w-auto">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search PR titles..."
              className="w-full h-9 pl-9 pr-3 text-xs bg-zinc-950 border border-white/10 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
          <div className="flex rounded-xl bg-zinc-950 p-1 border border-white/10">
            <button
              onClick={() => setViewMode('board')}
              className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all', viewMode === 'board' ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white')}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Kanban Board</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all', viewMode === 'list' ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white')}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>List Table</span>
            </button>
          </div>

          {!isGuestView && (
            <RoleGate permission="pr:create">
              <Button variant="primary" size="sm" onClick={() => setIsCreateModalOpen(true)} className="bg-gradient-to-r from-purple-600 to-indigo-600 border-purple-400/30">
                <Plus className="w-4 h-4" />
                <span>New Pull Request</span>
              </Button>
            </RoleGate>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="w-full h-64 rounded-2xl border border-white/10 bg-zinc-900/30 animate-pulse flex items-center justify-center text-zinc-500">
          Loading Review Engine...
        </div>
      ) : prList.length === 0 ? (
        <EmptyState
          title="No Pull Requests Open"
          subtitle="All PRs have been reviewed or merged. Create a new draft PR to initiate peer review."
          actionLabel={!isGuestView ? 'Create First PR' : undefined}
          onAction={!isGuestView ? () => setIsCreateModalOpen(true) : undefined}
        />
      ) : viewMode === 'list' ? (
        <Table data={prList} columns={tableColumns} onRowClick={(pr) => router.push(`/prs/${pr.id}`)} />
      ) : (
        /* Kanban Board (§11.2) */
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto pb-4 animate-in fade-in-50">
          {PR_COLUMNS.map((col) => {
            const colPRs = prList.filter((p) => p.status === col.status);
            return (
              <div key={col.status} className={cn('flex flex-col rounded-2xl border border-white/10 p-3 bg-zinc-900/40 min-h-[460px] shadow-lg', col.color)}>
                <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-zinc-200">{col.label}</span>
                  <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-[11px] font-bold text-zinc-400">{colPRs.length}</span>
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto max-h-[620px]">
                  {colPRs.map((pr) => {
                    const approvedCount = (pr.reviews || []).filter((r) => r.verdict === 'APPROVED').length;
                    const required = pr.requiredApprovals || 1;
                    return (
                      <div
                        key={pr.id}
                        onClick={() => router.push(`/prs/${pr.id}`)}
                        className="p-4 rounded-xl border border-white/10 bg-zinc-950/80 hover:bg-zinc-900 shadow-md transition-all cursor-pointer group hover:border-purple-500/50 hover:shadow-[0_0_15px_rgba(168,85,247,0.2)] space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono font-bold text-zinc-500">v{pr.version} (§26.2)</span>
                          <span className={cn('text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border', approvedCount >= required ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-amber-500/15 text-amber-300 border-amber-500/30')}>
                            {approvedCount} / {required} Approvals (§11.3)
                          </span>
                        </div>
                        <p className="text-sm font-extrabold text-white group-hover:text-purple-300 transition-colors line-clamp-2">
                          {pr.title}
                        </p>
                        <p className="text-[11px] text-zinc-400">By {pr.author?.fullName || 'Author'}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New PR Modal */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Submit Pull Request (§11.1)">
        <form onSubmit={handleCreatePR} className="space-y-4">
          <Input label="PR Title" placeholder="feat: migrate database layer to connection pool" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-zinc-300 uppercase">Change Summary (Markdown)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detail impacted files and validation performed..."
              className="w-full h-28 p-3 rounded-xl bg-zinc-900 border border-white/10 text-sm text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>
          <Input label="Required Approvals Count (§11.3)" type="number" min={1} max={5} value={String(requiredApprovals)} onChange={(e) => setRequiredApprovals(parseInt(e.target.value) || 1)} />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={isCreating} className="bg-purple-600 hover:bg-purple-500">Create Draft PR</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
