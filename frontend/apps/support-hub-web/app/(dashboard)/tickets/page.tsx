'use client';
import React from 'react';
import { useTickets, useOrgContext, useUpdateTicketStatus } from '@workspace/hooks';
import { Button, Input, Select, Badge, DigestCard, Table, EmptyState, Modal, RoleGate, cn } from '@workspace/ui-kit';
import { Ticket, TicketStatus } from '@workspace/types';
import { Plus, LayoutGrid, ListFilter, Search, ArrowUpRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { tickets } from '@workspace/api-client';

const KANBAN_COLUMNS: { status: TicketStatus; label: string; color: string }[] = [
  { status: 'OPEN', label: 'Open', color: 'border-blue-500/40 bg-blue-500/5' },
  { status: 'IN_PROGRESS', label: 'In Progress', color: 'border-amber-500/40 bg-amber-500/5' },
  { status: 'BLOCKED', label: 'Blocked', color: 'border-rose-500/40 bg-rose-500/5' },
  { status: 'RESOLVED', label: 'Resolved', color: 'border-emerald-500/40 bg-emerald-500/5' },
  { status: 'CLOSED', label: 'Closed', color: 'border-zinc-500/40 bg-zinc-500/5' },
];

export default function TicketsPage() {
  const { orgId, isGuestView } = useOrgContext();
  const [viewMode, setViewMode] = React.useState<'list' | 'board'>('board');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedStatus, setSelectedStatus] = React.useState<string>('');
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);

  // New Ticket state
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
  const ticketList = (ticketsResponse?.data || []) as Ticket[];

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
    } catch (err: any) {
      alert(err.message || 'Error creating ticket');
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
        onError: (err: any) => {
          alert(`State Transition Rejected (§26 Edge Case 3): ${err.message}`);
        },
      }
    );
  };

  const tableColumns = [
    {
      header: 'Title & Summary',
      render: (t: Ticket) => (
        <div className="space-y-0.5">
          <p className="font-bold text-white hover:text-indigo-400 transition-colors flex items-center gap-1.5">
            <span>{t.title}</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-zinc-500" />
          </p>
          <p className="text-xs text-zinc-400 line-clamp-1 max-w-md">{t.description}</p>
        </div>
      ),
    },
    {
      header: 'Status',
      render: (t: Ticket) => <Badge status={t.status} />,
    },
    {
      header: 'Priority',
      render: (t: Ticket) => <Badge status={t.priority} />,
    },
    {
      header: 'Assignee',
      render: (t: Ticket) => (
        <span className="text-xs font-semibold text-zinc-300">
          {t.assignee?.fullName || 'Unassigned'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* AI Progress Tracker Card (§15.1) */}
      <DigestCard />

      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-zinc-900/40 p-4 rounded-2xl border border-white/10 backdrop-blur-md">
        <div className="flex items-center gap-3 flex-1 w-full sm:w-auto">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tickets..."
              className="w-full h-9 pl-9 pr-3 text-xs bg-zinc-950 border border-white/10 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="h-9 px-3 text-xs bg-zinc-950 border border-white/10 rounded-xl text-zinc-300 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="BLOCKED">Blocked</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
          {/* List / Board Toggle (§10.1) */}
          <div className="flex rounded-xl bg-zinc-950 p-1 border border-white/10">
            <button
              onClick={() => setViewMode('board')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                viewMode === 'board' ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
              )}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Kanban Board</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                viewMode === 'list' ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
              )}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>List Table</span>
            </button>
          </div>

          {!isGuestView && (
            <RoleGate permission="ticket:create">
              <Button variant="primary" size="sm" onClick={() => setIsCreateModalOpen(true)} className="flex-shrink-0">
                <Plus className="w-4 h-4" />
                <span>New Ticket</span>
              </Button>
            </RoleGate>
          )}
        </div>
      </div>

      {/* Main View Area */}
      {isLoading ? (
        <div className="w-full h-64 rounded-2xl border border-white/10 bg-zinc-900/30 animate-pulse flex items-center justify-center text-zinc-500">
          Loading ticketing workspace...
        </div>
      ) : ticketList.length === 0 ? (
        <EmptyState
          title="No Tickets Found"
          subtitle="Your organization currently has zero open tickets matching these filters."
          actionLabel={!isGuestView ? 'Create First Ticket' : undefined}
          onAction={!isGuestView ? () => setIsCreateModalOpen(true) : undefined}
        />
      ) : viewMode === 'list' ? (
        <Table
          data={ticketList}
          columns={tableColumns}
          onRowClick={(t) => router.push(`/tickets/${t.id}`)}
          className="animate-in fade-in-50"
        />
      ) : (
        /* Kanban Board (§10.1) */
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto pb-4 animate-in fade-in-50">
          {KANBAN_COLUMNS.map((col) => {
            const colTickets = ticketList.filter((t) => t.status === col.status);
            return (
              <div
                key={col.status}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, col.status)}
                className={cn(
                  'flex flex-col rounded-2xl border border-white/10 p-3 bg-zinc-900/40 min-h-[460px] shadow-lg transition-all',
                  col.color
                )}
              >
                <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-zinc-200">{col.label}</span>
                  <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-[11px] font-bold text-zinc-400">
                    {colTickets.length}
                  </span>
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto max-h-[620px]">
                  {colTickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      draggable={!isGuestView}
                      onDragStart={(e) => handleDragStart(e, ticket)}
                      onClick={() => router.push(`/tickets/${ticket.id}`)}
                      className="p-4 rounded-xl border border-white/10 bg-zinc-950/80 hover:bg-zinc-900 shadow-md transition-all duration-200 cursor-pointer group hover:border-indigo-500/50 hover:shadow-[0_0_15px_rgba(99,102,241,0.2)]"
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <Badge status={ticket.priority} className="text-[10px] px-2 py-0.5" />
                        {ticket.shares && ticket.shares.length > 0 && (
                          <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                            Shared (§10.6)
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-extrabold text-white group-hover:text-indigo-300 transition-colors line-clamp-2">
                        {ticket.title}
                      </p>
                      <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{ticket.description}</p>
                      
                      <div className="flex items-center justify-between mt-4 pt-2 border-t border-white/5 text-[11px] text-zinc-500 font-mono">
                        <span>v{ticket.version}</span>
                        <span className="truncate max-w-[120px]">{ticket.assignee?.fullName || 'Unassigned'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Ticket Modal */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create New Ticket (§10.1)">
        <form onSubmit={handleCreateTicket} className="space-y-4">
          <Input
            label="Ticket Title"
            placeholder="Login timeout spikes during peak hours"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            required
          />
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-zinc-300 uppercase">Description (Markdown Supported)</label>
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Provide context, error traces, and steps to reproduce..."
              className="w-full h-28 p-3 rounded-xl bg-zinc-900 border border-white/10 text-sm text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          <Select label="Priority Level" value={newPriority} onChange={(e) => setNewPriority(e.target.value)}>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </Select>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={isCreating}>Create Ticket</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
