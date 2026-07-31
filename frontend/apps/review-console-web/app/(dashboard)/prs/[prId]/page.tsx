'use client';
import React from 'react';
import { usePRDetail, useSession, useOrgContext } from '@workspace/hooks';
import { Button, Badge, Modal, DiffViewer, RoleGate, Textarea, cn } from '@workspace/ui-kit';
import { prs, orgs } from '@workspace/api-client';
import { ArrowLeft, Send, CheckCircle2, XCircle, ShieldAlert, AlertTriangle, FileDiff, User, GitMerge, Clock } from 'lucide-react';
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

export default function PRDetailPage() {
  const params = useParams();
  const prId = String(params.prId);
  const { orgId, isGuestView } = useOrgContext();
  const { data: session } = useSession();
  const router = useRouter();

  const { data: pr, isLoading, error, refetch } = usePRDetail(orgId, prId);
  const [comments, setComments] = React.useState<any[]>([]);
  const [newComment, setNewComment] = React.useState('');
  const [isPosting, setIsPosting] = React.useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = React.useState(false);
  const [rejectReason, setRejectReason] = React.useState('');
  const [isReviewing, setIsReviewing] = React.useState(false);
  const [toast, setToast] = React.useState<{ message: string; type: 'error' | 'success' } | null>(null);
  const [members, setMembers] = React.useState<any[]>([]);

  const showToast = (message: string, type: 'error' | 'success') => setToast({ message, type });

  React.useEffect(() => {
    if (orgId) {
      orgs.listMembers(orgId).then(setMembers).catch(() => {});
    }
  }, [orgId]);

  const fetchComments = React.useCallback(async () => {
    if (!orgId || !prId) return;
    try {
      const list = await prs.listComments(orgId, prId);
      setComments(list || []);
    } catch { }
  }, [orgId, prId]);

  React.useEffect(() => { fetchComments(); }, [fetchComments]);

  const handleApprove = async () => {
    setIsReviewing(true);
    try {
      await prs.review(orgId, prId, 'APPROVED');
      refetch();
      showToast('Pull Request approved!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Review failed', 'error');
    } finally {
      setIsReviewing(false);
    }
  };

  const handleSubmitPR = async () => {
    setIsReviewing(true);
    try {
      await prs.submit(orgId, prId);
      refetch();
      showToast('Pull Request submitted for review', 'success');
    } catch (err: any) {
      showToast(err.message || 'Submission failed', 'error');
    } finally {
      setIsReviewing(false);
    }
  };

  const handleRequestChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectReason.trim()) {
      showToast('Mandatory feedback note required when requesting changes', 'error');
      return;
    }
    setIsReviewing(true);
    try {
      await prs.review(orgId, prId, 'CHANGES_REQUESTED', rejectReason.trim());
      setIsRejectModalOpen(false);
      setRejectReason('');
      refetch();
      showToast('Changes requested successfully', 'success');
    } catch (err: any) {
      showToast(err.message || 'Review submission failed', 'error');
    } finally {
      setIsReviewing(false);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setIsPosting(true);
    try {
      await prs.createComment(orgId, prId, { body: newComment.trim() });
      setNewComment('');
      fetchComments();
    } catch (err: any) {
      showToast(err.message || 'Comment post failed', 'error');
    } finally {
      setIsPosting(false);
    }
  };

  if (error) {
    return (
      <div className="w-full h-80 rounded-xl border flex flex-col items-center justify-center gap-4" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
        <AlertTriangle className="w-8 h-8 text-red-500" />
        <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{(error as any).message || 'Could not load PR'}</p>
        <Button variant="secondary" size="sm" onClick={() => router.push('/prs')}>← Back to PRs</Button>
      </div>
    );
  }

  if (isLoading || !pr) {
    return (
      <div className="space-y-6 page-enter">
        <div className="h-8 w-32 rounded-lg shimmer" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-48 rounded-xl shimmer" />
            <div className="h-48 rounded-xl shimmer" />
          </div>
          <div className="h-96 rounded-xl shimmer" />
        </div>
      </div>
    );
  }

  const isAuthor = session?.user.id === pr.authorId;
  const approvedCount = (pr.reviewers || []).filter(r => r.decision === 'APPROVED').length;
  const required = pr.requiredApprovals || 1;
  const approvalPct = Math.min((approvedCount / required) * 100, 100);
  const isApproved = approvedCount >= required;

  const mockDiffData = [
    { value: '@@ -12,6 +12,8 @@ class OrganizationController {\n  async createInvite(req: Request, res: Response) {\n    const { email, role } = req.body;' },
    { removed: true, value: '-    const invite = await this.service.sendInvite(email, role);\n-    return res.json({ status: "ok" });' },
    { added: true, value: '+    // Strict tenant boundary checking\n+    const invite = await this.service.sendInvite(req.orgContext!.orgId!, email, role);\n+    return res.status(201).json({ status: "ok", invite });' },
    { value: '  }\n}' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 page-enter pb-10">
      {toast && <Toast {...toast} onDismiss={() => setToast(null)} />}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={() => router.push('/prs')}
          className="inline-flex items-center gap-2 text-sm font-medium hover:underline transition-all"
          style={{ color: 'var(--text-secondary)' }}
        >
          <ArrowLeft className="w-4 h-4" /> Back to PR Board
        </button>

        {!isGuestView && (
          <div className="flex items-center gap-3">
            {pr.status === 'DRAFT' && (
              <RoleGate permission="pr:create">
                <Button size="sm" variant="primary" onClick={handleSubmitPR} isLoading={isReviewing}>
                  <Send className="w-4 h-4 mr-1.5" />
                  Submit for Review
                </Button>
              </RoleGate>
            )}

            {pr.status === 'MERGED' && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-500/10 dark:text-purple-300 dark:border-purple-500/25 text-xs font-semibold">
                <GitMerge className="w-3.5 h-3.5" />
                Merged
              </span>
            )}

            {(pr.status === 'IN_REVIEW' || pr.status === 'APPROVED' || pr.status === 'REJECTED') && (
              <RoleGate permission="pr:review">
                {isAuthor ? (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/25 text-xs font-semibold">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    Author cannot approve own PR
                  </span>
                ) : (
                  <>
                    <Button variant="secondary" size="sm" onClick={() => setIsRejectModalOpen(true)} disabled={isReviewing}>
                      <XCircle className="w-4 h-4 text-red-500 mr-1.5" />
                      Request Changes
                    </Button>
                    <Button size="sm" variant="primary" onClick={handleApprove} isLoading={isReviewing}>
                      <CheckCircle2 className="w-4 h-4 mr-1.5" />
                      Approve
                    </Button>
                  </>
                )}
              </RoleGate>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
            <div className="flex flex-wrap items-center gap-3 mb-5">
              <Badge status={pr.status} />
              <span className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border',
                isApproved ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/25' : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/25'
              )}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                {approvedCount}/{required} Approvals
              </span>
              <span className="text-[11px] font-medium ml-auto" style={{ color: 'var(--text-tertiary)' }}>v{pr._count?.versions || 1}</span>
            </div>
            
            <h1 className="text-2xl font-semibold leading-snug mb-5" style={{ color: 'var(--text-primary)' }}>{pr.title}</h1>

            <div className="space-y-2 mb-6">
              <div className="w-full h-1.5 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all duration-700', isApproved ? 'bg-emerald-500' : 'bg-[var(--accent)]')}
                  style={{ width: `${approvalPct}%` }}
                />
              </div>
              <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                {isApproved ? 'Ready to merge — all required approvals received' : `Awaiting ${required - approvedCount} more approval${required - approvedCount !== 1 ? 's' : ''}`}
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Description</p>
              <div className="p-4 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-sm leading-relaxed whitespace-pre-wrap font-mono" style={{ color: 'var(--text-secondary)' }}>
                {pr.description || 'No description provided.'}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <FileDiff className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                Version Diff Inspector
              </h2>
              <span className="text-[10px] font-mono px-2 py-1 rounded bg-[var(--bg-tertiary)]" style={{ color: 'var(--text-secondary)' }}>
                commit #a8f3b21
              </span>
            </div>
            <DiffViewer diffData={mockDiffData} />
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm space-y-6">
            <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              Review Comments
              <span className="px-2 py-0.5 rounded-md bg-[var(--bg-tertiary)] text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{comments.length}</span>
            </h2>

            <div className="space-y-5">
              {comments.length === 0 ? (
                <p className="text-sm italic py-4 text-center" style={{ color: 'var(--text-tertiary)' }}>No review comments yet.</p>
              ) : (
                comments.map((c: any) => (
                  <div key={c.id} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[var(--bg-tertiary)] flex items-center justify-center text-xs font-medium shrink-0" style={{ color: 'var(--text-secondary)' }}>
                      {c.author?.fullName?.[0] || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{c.author?.fullName || 'Reviewer'}</span>
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
                    placeholder={isGuestView ? 'Add a guest feedback note...' : 'Leave a review comment...'}
                 />
              </div>
              <Button type="submit" variant="primary" size="md" className="self-end" isLoading={isPosting}>
                <Send className="w-4 h-4" /> Post
              </Button>
            </form>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Details</h3>
            <div className="space-y-3.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}><User className="w-4 h-4" /> Author</span>
                <span className="font-medium" style={{ color: 'var(--accent-text)' }}>{pr.author?.fullName || 'Developer'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}><Clock className="w-4 h-4" /> Created</span>
                <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{new Date(pr.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="pt-3 mt-1 border-t border-[var(--border-light)] text-xs flex items-center justify-between">
                <span style={{ color: 'var(--text-secondary)' }}>Target Branch: </span>
                <div>
                   <code className="text-[10px] bg-[var(--bg-secondary)] px-1.5 py-0.5 rounded" style={{ color: 'var(--text-secondary)' }}>main</code>
                   <span className="mx-1" style={{ color: 'var(--text-tertiary)' }}>←</span>
                   <code className="text-[10px] bg-[var(--accent-light)] px-1.5 py-0.5 rounded" style={{ color: 'var(--accent-text)' }}>feature/auth</code>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Reviewers</h3>
              {!isGuestView && (pr.status === 'DRAFT' || pr.status === 'IN_REVIEW' || pr.status === 'REJECTED' || pr.status === 'APPROVED') && (
                <select 
                  className="text-[10px] bg-[var(--bg)] border border-[var(--border)] rounded px-1.5 py-1 text-[var(--text-secondary)] font-medium outline-none focus:border-[var(--accent)]"
                  onChange={(e) => {
                    if (e.target.value) {
                       prs.assignReviewer(orgId, prId, e.target.value)
                          .then(() => { refetch(); e.target.value = ''; showToast('Reviewer assigned', 'success'); })
                          .catch(err => { showToast(err.message || 'Failed to assign', 'error'); e.target.value = ''; });
                    }
                  }}
                  value=""
                >
                  <option value="" disabled>+ Assign</option>
                  {members.filter(m => m.orgRole === 'ORG_ADMIN' || m.orgRole === 'REVIEWER_APPROVER').map(m => (
                    <option key={m.userId} value={m.userId}>{m.user?.fullName || m.userId}</option>
                  ))}
                </select>
              )}
            </div>
            {!pr.reviewers || pr.reviewers.length === 0 ? (
              <p className="text-sm italic" style={{ color: 'var(--text-tertiary)' }}>No reviewers assigned.</p>
            ) : (
              <div className="space-y-3">
                {pr.reviewers.map((reviewer: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-[var(--bg-tertiary)] flex items-center justify-center text-[10px] font-semibold shrink-0" style={{ color: 'var(--text-secondary)' }}>
                        {reviewer.user?.fullName?.[0] || reviewer.fullName?.[0] || 'R'}
                      </div>
                      <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                        {reviewer.user?.fullName || reviewer.fullName || 'Reviewer'}
                      </span>
                    </div>
                    {reviewer.decision === 'APPROVED' ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                      </span>
                    ) : reviewer.decision === 'CHANGES_REQUESTED' ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-red-600 dark:text-red-400">
                        <XCircle className="w-3.5 h-3.5" /> Changes
                      </span>
                    ) : (
                      <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>Pending</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="pt-4 border-t border-[var(--border)] space-y-2">
              <div className="w-full h-1.5 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all duration-700', isApproved ? 'bg-emerald-500' : 'bg-[var(--accent)]')}
                  style={{ width: `${approvalPct}%` }}
                />
              </div>
              <p className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>{approvedCount} of {required} approvals</p>
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={isRejectModalOpen} onClose={() => setIsRejectModalOpen(false)} title="Request Changes">
        <form onSubmit={handleRequestChanges} className="space-y-4 mt-2">
          <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 border border-red-200 dark:bg-red-950/30 dark:border-red-900/50 text-red-800 dark:text-red-300 text-sm">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <p>This will transition the PR to REJECTED and block merging. A mandatory reason is required.</p>
          </div>
          <Textarea
             label="Feedback / Reason"
             value={rejectReason}
             onChange={(e) => setRejectReason(e.target.value)}
             required
             placeholder="Explain what needs to be fixed..."
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setIsRejectModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="destructive" isLoading={isReviewing}>Submit Feedback</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
