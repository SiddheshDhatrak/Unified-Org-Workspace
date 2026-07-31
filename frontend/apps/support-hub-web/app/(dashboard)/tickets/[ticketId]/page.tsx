'use client';
import React from 'react';
import { useTicketDetail, useOrgContext, useUpdateTicketStatus } from '@workspace/hooks';
import { Button, Badge, Modal, RoleGate, Textarea, cn } from '@workspace/ui-kit';
import { tickets } from '@workspace/api-client';
import { ArrowLeft, Send, Paperclip, Share2, AlertTriangle, RefreshCw, CheckCircle2, XCircle, Clock, User, ChevronDown } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';

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

const STATUS_FLOW = ['OPEN', 'IN_PROGRESS', 'BLOCKED', 'RESOLVED', 'CLOSED'];

function AssigneeDropdown({
  currentAssigneeId,
  members,
  onAssign,
  disabled
}: {
  currentAssigneeId: string | null;
  members: any[];
  onAssign: (id: string | null) => void;
  disabled?: boolean;
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentMember = members.find(m => m.userId === currentAssigneeId);
  const displayName = currentMember?.user?.fullName || currentMember?.userId || 'Unassigned';

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "text-sm font-medium focus:outline-none transition-colors max-w-[160px] text-right flex items-center justify-end gap-1.5",
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:text-[var(--accent)]"
        )}
        style={{ color: 'var(--text-primary)' }}
      >
        <span className="truncate">{displayName}</span>
        {!disabled && <ChevronDown className="w-3.5 h-3.5 opacity-50 shrink-0" />}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-xl shadow-xl border border-[var(--border)] bg-[var(--surface)] py-1 z-50 overflow-hidden text-sm animate-in fade-in zoom-in-95 duration-100">
          <button
            onClick={() => { onAssign(null); setIsOpen(false); }}
            className="w-full text-left px-3 py-2 hover:bg-[var(--surface-hover)] transition-colors"
            style={{ color: 'var(--text-primary)' }}
          >
            Unassigned
          </button>
          {members.map(m => (
            <button
              key={m.userId}
              onClick={() => { onAssign(m.userId); setIsOpen(false); }}
              className="w-full text-left px-3 py-2 hover:bg-[var(--surface-hover)] transition-colors truncate"
              style={{ color: 'var(--text-primary)' }}
            >
              {m.user?.fullName || m.userId}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TicketDetailPage() {
  const params = useParams();
  const ticketId = String(params.ticketId);
  const { orgId, isGuestView } = useOrgContext();
  const router = useRouter();

  const { data: ticket, isLoading, error, refetch } = useTicketDetail(orgId, ticketId);
  const updateStatus = useUpdateTicketStatus(orgId);
  const [comments, setComments] = React.useState<any[]>([]);
  const [newComment, setNewComment] = React.useState('');
  const [isPosting, setIsPosting] = React.useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState<number | null>(null);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const [retryCount, setRetryCount] = React.useState(0);
  const [toast, setToast] = React.useState<{ message: string; type: 'error' | 'success' } | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [members, setMembers] = React.useState<any[]>([]);
  const [attachments, setAttachments] = React.useState<{name: string}[]>([{ name: 'system_logs.txt' }]);

  React.useEffect(() => {
    if (orgId) {
      import('@workspace/api-client').then(m => m.orgs.listMembers(orgId).then(setMembers).catch(() => {}));
    }
  }, [orgId]);

  const showToast = (message: string, type: 'error' | 'success') => setToast({ message, type });

  const fetchComments = React.useCallback(async () => {
    if (!orgId || !ticketId) return;
    try {
      const list = await tickets.listComments(orgId, ticketId);
      setComments(list || []);
    } catch { }
  }, [orgId, ticketId]);

  React.useEffect(() => { fetchComments(); }, [fetchComments]);

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setIsPosting(true);
    try {
      await tickets.createComment(orgId, ticketId, newComment.trim());
      setNewComment('');
      fetchComments();
    } catch (err: any) {
      showToast(err.message || 'Error posting comment', 'error');
    } finally {
      setIsPosting(false);
    }
  };

  const handleStatusChange = (newStatus: string) => {
    if (!ticket) return;
    updateStatus.mutate(
      { ticketId: ticket.id, status: newStatus as any, version: ticket.version },
      {
        onSuccess: () => { refetch(); showToast(`Status updated to ${newStatus}`, 'success'); },
        onError: (err: any) => showToast(err.message || 'Status update failed', 'error'),
      }
    );
  };

  const handleSimulatedUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setUploadError(null);
    setUploadProgress(10);
    const timer = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev === null) return null;
        if (prev >= 80 && retryCount < 1 && Math.random() > 0.8) {
          clearInterval(timer);
          setUploadError('Network drop detected. Retrying automatically...');
          setTimeout(() => { setRetryCount(c => c + 1); setUploadError(null); setUploadProgress(100); }, 1500);
          return prev;
        }
        if (prev >= 100) { 
          clearInterval(timer); 
          setTimeout(() => {
            setUploadProgress(null);
            setAttachments(a => [...a, { name: file.name }]);
            showToast('File uploaded successfully', 'success');
            if (fileInputRef.current) fileInputRef.current.value = '';
          }, 800); 
          return 100; 
        }
        return prev + 30;
      });
    }, 400);
  };

  if (error) {
    return (
      <div className="w-full h-80 rounded-xl border flex flex-col items-center justify-center gap-4" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
        <AlertTriangle className="w-8 h-8 text-red-500" />
        <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{(error as any).message || 'Could not load ticket'}</p>
        <Button variant="secondary" size="sm" onClick={() => router.push('/tickets')}>← Back to tickets</Button>
      </div>
    );
  }

  if (isLoading || !ticket) {
    return (
      <div className="space-y-6 page-enter">
        <div className="h-8 w-32 rounded-lg shimmer" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-48 rounded-xl shimmer" />
            <div className="h-64 rounded-xl shimmer" />
          </div>
          <div className="h-96 rounded-xl shimmer" />
        </div>
      </div>
    );
  }

  const currentStatusIndex = STATUS_FLOW.indexOf(ticket.status);

  return (
    <div className="max-w-6xl mx-auto space-y-6 page-enter pb-10">
      {toast && <Toast {...toast} onDismiss={() => setToast(null)} />}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={() => router.push('/tickets')}
          className="inline-flex items-center gap-2 text-sm font-medium hover:underline transition-all"
          style={{ color: 'var(--text-secondary)' }}
        >
          <ArrowLeft className="w-4 h-4" /> Back to tickets
        </button>

        <div className="flex items-center gap-3">
          {!isGuestView && (
            <RoleGate permission="crossorg:share">
              <Button variant="secondary" size="sm" onClick={() => setIsShareModalOpen(true)}>
                <Share2 className="w-4 h-4" style={{ color: 'var(--accent)' }} /> Share
              </Button>
            </RoleGate>
          )}
          {!isGuestView && (
            <RoleGate permission="ticket:delete">
              <Button variant="destructive" size="sm" onClick={async () => {
                if (confirm('Permanently delete this ticket?')) {
                  await tickets.delete(orgId, ticket.id);
                  router.push('/tickets');
                }
              }}>Delete</Button>
            </RoleGate>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
            <div className="flex flex-wrap items-center gap-2 mb-5">
              <Badge status={ticket.status} />
              <Badge status={ticket.priority} />
              {ticket.shares && ticket.shares.length > 0 && (
                <span className="px-2 py-0.5 rounded-md bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-400 text-xs font-medium">Shared</span>
              )}
              <span className="text-[11px] font-medium ml-auto" style={{ color: 'var(--text-tertiary)' }}>v{ticket.version}</span>
            </div>

            <h1 className="text-2xl font-semibold leading-snug mb-5" style={{ color: 'var(--text-primary)' }}>{ticket.title}</h1>

            <div className="space-y-2 mb-6">
              <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Description</p>
              <div className="p-4 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-sm leading-relaxed whitespace-pre-wrap font-mono" style={{ color: 'var(--text-secondary)' }}>
                {ticket.description}
              </div>
            </div>

            <div className="pt-5 border-t border-[var(--border)]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  <Paperclip className="w-4 h-4" style={{ color: 'var(--accent)' }} /> Attachments
                </div>
                <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploadProgress !== null}>Upload File</Button>
                <input type="file" className="hidden" ref={fileInputRef} onChange={handleSimulatedUpload} />
              </div>
              
              {attachments.length > 0 && (
                <div className="flex flex-col gap-2 mb-3">
                  {attachments.map((att, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg)]">
                      <span className="text-xs font-medium text-[var(--text-primary)]">{att.name}</span>
                      <span className="text-[10px] text-[var(--text-tertiary)]">Just now</span>
                    </div>
                  ))}
                </div>
              )}

              {uploadError && (
                <p className="text-sm text-red-500 flex items-center gap-2 mb-3">
                  <RefreshCw className="w-4 h-4 animate-spin" /> {uploadError}
                </p>
              )}
              {uploadProgress !== null && (
                <div className="space-y-1.5 mt-2">
                  <div className="flex justify-between text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                    <div className="h-full bg-[var(--accent)] transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm space-y-6">
            <h2 className="text-base font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              Activity & Comments
              <span className="px-2 py-0.5 rounded-md bg-[var(--bg-tertiary)] text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{comments.length}</span>
            </h2>

            <div className="space-y-5">
              {comments.length === 0 ? (
                <p className="text-sm italic py-4 text-center" style={{ color: 'var(--text-tertiary)' }}>No comments yet.</p>
              ) : (
                comments.map((c: any) => (
                  <div key={c.id} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[var(--bg-tertiary)] flex items-center justify-center text-xs font-medium shrink-0" style={{ color: 'var(--text-secondary)' }}>
                      {c.author?.fullName?.[0] || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{c.author?.fullName || 'User'}</span>
                        <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                          {new Date(c.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="text-sm bg-[var(--bg)] p-3 rounded-lg border border-[var(--border)] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                        {c.body}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handlePostComment} className="flex gap-3 pt-4 border-t border-[var(--border)]">
              <div className="flex-1">
                 <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder={isGuestView ? 'Add a guest comment...' : 'Write a comment...'}
                 />
              </div>
              <Button type="submit" variant="primary" size="md" className="self-end" isLoading={isPosting}>
                <Send className="w-4 h-4" /> Post
              </Button>
            </form>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Details</h3>
            <div className="space-y-3.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}><User className="w-4 h-4" /> Creator</span>
                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{ticket.creator?.fullName || 'Admin'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}><User className="w-4 h-4" /> Assignee</span>
                <AssigneeDropdown
                  currentAssigneeId={ticket.assignee?.id || null}
                  members={members}
                  disabled={isGuestView}
                  onAssign={async (newAssigneeId) => {
                    try {
                      await tickets.assign(orgId, ticket.id, newAssigneeId);
                      refetch();
                      showToast('Assignee updated', 'success');
                    } catch (err: any) {
                      showToast(err.message || 'Error updating assignee', 'error');
                    }
                  }}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}><Clock className="w-4 h-4" /> Created</span>
                <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{new Date(ticket.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {!isGuestView && (
            <RoleGate permission="ticket:update">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Status</h3>
                <div className="space-y-2">
                  {STATUS_FLOW.map((status, idx) => {
                    const isCurrent = ticket.status === status;
                    const isPast = idx < currentStatusIndex;
                    return (
                      <button
                        key={status}
                        onClick={() => !isCurrent && handleStatusChange(status)}
                        disabled={isCurrent || updateStatus.isPending}
                        className={cn(
                          'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left border',
                          isCurrent
                            ? 'bg-[var(--accent-light)] border-[var(--accent)]'
                            : isPast
                            ? 'bg-[var(--bg-secondary)] border-[var(--border)] hover:bg-[var(--surface-hover)]'
                            : 'bg-[var(--surface)] border-[var(--border)] hover:bg-[var(--surface-hover)]'
                        )}
                        style={{ color: isCurrent ? 'var(--accent-text)' : 'var(--text-primary)' }}
                      >
                        <div className={cn('w-2 h-2 rounded-full shrink-0', isCurrent ? 'bg-[var(--accent)]' : isPast ? 'bg-emerald-500' : 'bg-[var(--border)]')} />
                        {status.replace(/_/g, ' ')}
                        {isCurrent && <span className="ml-auto text-[10px]" style={{ color: 'var(--text-tertiary)' }}>Current</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            </RoleGate>
          )}
        </div>
      </div>

      <Modal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} title="Share with Partner">
        <div className="space-y-4 mt-2">
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Grant read and comment access to partner organizations. Partners enter Guest View mode.
          </p>
          <div className="p-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Globex Corporation</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>Approved Connection</p>
            </div>
            <Button
              variant="primary" size="sm"
              onClick={async () => {
                try {
                  await tickets.share(orgId, ticket.id, 'org-globex');
                  setIsShareModalOpen(false);
                  refetch();
                  showToast('Ticket shared successfully!', 'success');
                } catch (e: any) {
                  showToast(e.message || 'Share failed', 'error');
                  setIsShareModalOpen(false);
                }
              }}
            >
              Share
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
