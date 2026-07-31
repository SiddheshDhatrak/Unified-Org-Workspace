'use client';
import React from 'react';
import { useTickets, useOrgContext, useUpdateTicketStatus } from '@workspace/hooks';
import { Button, Badge, DigestCard, Table, EmptyState, Modal, RoleGate, Input, Textarea, Select, cn } from '@workspace/ui-kit';
import { Ticket, TicketStatus } from '@workspace/types';
import { Plus, LayoutGrid, ListFilter, Search, ArrowUpRight, FolderDot, Clock, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { tickets } from '@workspace/api-client';

const KANBAN_COLUMNS: { status: TicketStatus; label: string; }[] = [
  { status: 'OPEN', label: 'Open' },
  { status: 'IN_PROGRESS', label: 'In Progress' },
  { status: 'BLOCKED', label: 'Blocked' },
  { status: 'RESOLVED', label: 'Resolved' },
  { status: 'CLOSED', label: 'Closed' },
];

function Toast({ message, type, onDismiss }: { message: string; type: 'error' | 'success'; onDismiss: () => void }) {
  React.useEffect(() => {
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div className={cn(
      'fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-lg border shadow-xl text-sm font-medium toast-enter max-w-sm transition-all',
      type === 'error'
        ? 'bg-red-50 text-red-900 border-red-200 dark:bg-red-950/80 dark:border-red-900/50 dark:text-red-200'
        : 'bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/80 dark:border-emerald-900/50 dark:text-emerald-200'
    )}>
      {type === 'error' ? <XCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
      <span>{message}</span>
      <button onClick={onDismiss} className="ml-auto opacity-50 hover:opacity-100">✕</button>
    </div>
  );
}

export default function TicketsPage() {
  const { orgId, isGuestView } = useOrgContext();
  const [viewMode, setViewMode] = React.useState<'list' | 'board'>('board');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedStatus, setSelectedStatus] = React.useState<string>('');
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [toast, setToast] = React.useState<{ message: string; type: 'error' | 'success' } | null>(null);

  const [newTitle, setNewTitle] = React.useState('');
  const [newDescription, setNewDescription] = React.useState('');
  const [newPriority, setNewPriority] = React.useState('MEDIUM');
  const [isCreating, setIsCreating] = React.useState(false);

  const router = useRouter();
  const { data: ticketsResponse, isLoading, refetch } = useTickets(orgId, {
    q: searchQuery || undefined,
    status: selectedStatus || undefined,
  });

  const updateStatusMutation = useUpdateTicketStatus(orgId);
  const ticketList = (Array.isArray(ticketsResponse) ? ticketsResponse : ticketsResponse?.data || []) as Ticket[];

  const openCount = ticketList.filter(t => t.status === 'OPEN').length;
  const inProgressCount = ticketList.filter(t => t.status === 'IN_PROGRESS').length;
  const blockedCount = ticketList.filter(t => t.status === 'BLOCKED').length;
  const resolvedCount = ticketList.filter(t => t.status === 'RESOLVED').length;

  const showToast = (message: string, type: 'error' | 'success') => setToast({ message, type });

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;
    setIsCreating(true);
    try {
      await tickets.create(orgId, { title: newTitle, description: newDescription, priority: newPriority as any });
      setIsCreateModalOpen(false);
      setNewTitle('');
      setNewDescription('');
      refetch();
      showToast('Ticket created successfully!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Error creating ticket', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, ticket: Ticket) => {
    e.dataTransfer.setData('ticketId', ticket.id);
    e.dataTransfer.setData('version', String(ticket.version));
  };

  const handleDrop = (e: React.DragEvent, targetStatus: TicketStatus) => {
    e.preventDefault();
    const ticketId = e.dataTransfer.getData('ticketId');
    const version = parseInt(e.dataTransfer.getData('version'), 10);
    if (!ticketId) return;
    updateStatusMutation.mutate(
      { ticketId, status: targetStatus, version },
      { 
        onSuccess: () => {
          refetch();
          showToast(`Ticket moved to ${targetStatus}`, 'success');
        },
        onError: (err: any) => showToast(`Transition rejected: ${err.message}`, 'error') 
      }
    );
  };

  const tableColumns = [
    {
      header: 'Title',
      render: (t: Ticket) => (
        <div className="space-y-0.5">
          <p className="font-medium hover:underline flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
            {t.title}
          </p>
          <p className="text-xs line-clamp-1 max-w-md" style={{ color: 'var(--text-tertiary)' }}>{t.description}</p>
        </div>
      ),
    },
    { header: 'Status', render: (t: Ticket) => <Badge status={t.status} /> },
    { header: 'Priority', render: (t: Ticket) => <Badge status={t.priority} /> },
    {
      header: 'Assignee',
      render: (t: Ticket) => (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-[var(--bg-tertiary)] flex items-center justify-center text-[10px] font-semibold text-[var(--text-secondary)] shrink-0">
            {t.assignee?.fullName?.[0] || '?'}
          </div>
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{t.assignee?.fullName || 'Unassigned'}</span>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 page-enter pb-10">
      {toast && <Toast {...toast} onDismiss={() => setToast(null)} />}

      <DigestCard />

      {!isLoading && ticketList.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Open', count: openCount, icon: FolderDot },
            { label: 'In Progress', count: inProgressCount, icon: Clock },
            { label: 'Blocked', count: blockedCount, icon: AlertCircle },
            { label: 'Resolved', count: resolvedCount, icon: CheckCircle2 },
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
        <div className="flex items-center gap-3 flex-1 w-full sm:w-auto">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tickets..."
              className="w-full h-9 pl-9 pr-3 text-sm rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-all"
            />
          </div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="h-9 px-3 text-sm rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
          >
            <option value="">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="BLOCKED">Blocked</option>
            <option value="RESOLVED">Resolved</option>
          </select>
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
            <Button variant="primary" size="sm" onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="w-4 h-4" />
              New Ticket
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        viewMode === 'board' ? (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {KANBAN_COLUMNS.map(col => (
              <div key={col.status} className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-3 min-h-[420px]">
                <div className="h-4 w-20 rounded shimmer mb-4" />
                {[1, 2].map(i => (
                  <div key={i} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 mb-3">
                    <div className="h-3 w-full rounded shimmer mb-2" />
                    <div className="h-3 w-2/3 rounded shimmer" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <Table data={[]} columns={tableColumns} isLoading />
        )
      ) : ticketList.length === 0 ? (
        <EmptyState
          title="No Tickets Found"
          subtitle="Your organization has no tickets matching these filters."
          actionLabel={!isGuestView ? 'Create Ticket' : undefined}
          onAction={!isGuestView ? () => setIsCreateModalOpen(true) : undefined}
        />
      ) : viewMode === 'list' ? (
        <Table data={ticketList} columns={tableColumns} onRowClick={(t) => router.push(`/tickets/${t.id}`)} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {KANBAN_COLUMNS.map((col) => {
            const colTickets = ticketList.filter((t) => t.status === col.status);
            return (
              <div
                key={col.status}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, col.status)}
                className="flex flex-col rounded-xl bg-[var(--bg-secondary)] min-h-[500px] border border-[var(--border)]"
              >
                <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{col.label}</span>
                  <span className="px-2 py-0.5 rounded-md bg-[var(--bg-tertiary)] text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                    {colTickets.length}
                  </span>
                </div>

                <div className="flex-1 p-3 space-y-3 overflow-y-auto">
                  {colTickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      draggable={!isGuestView}
                      onDragStart={(e) => handleDragStart(e, ticket)}
                      onClick={() => router.push(`/tickets/${ticket.id}`)}
                      className="group flex flex-col gap-3 p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-[var(--accent)]"
                    >
                      <div className="flex flex-wrap gap-2 items-center justify-between">
                        <Badge status={ticket.priority} />
                        {ticket.shares && ticket.shares.length > 0 && (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-400">
                            Shared
                          </span>
                        )}
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium leading-snug mb-1" style={{ color: 'var(--text-primary)' }}>
                          {ticket.title}
                        </p>
                        {ticket.description && (
                          <p className="text-xs line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{ticket.description}</p>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-3 mt-1 border-t border-[var(--border-light)]">
                        <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>v{ticket.version}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                            {ticket.assignee?.fullName || 'Unassigned'}
                          </span>
                          <div className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold bg-[var(--bg-tertiary)]" style={{ color: 'var(--text-secondary)' }}>
                            {ticket.assignee?.fullName?.[0] || '?'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create Ticket">
        <form onSubmit={handleCreateTicket} className="space-y-4 mt-2">
          <Input label="Title" value={newTitle} onChange={e => setNewTitle(e.target.value)} required placeholder="Short summary of the issue" />
          <Textarea label="Description" value={newDescription} onChange={e => setNewDescription(e.target.value)} required placeholder="Provide context..." />
          <Select label="Priority" value={newPriority} onChange={e => setNewPriority(e.target.value)}>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </Select>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={isCreating}>Create Ticket</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
