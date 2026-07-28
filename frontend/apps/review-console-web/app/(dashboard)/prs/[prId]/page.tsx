'use client';
import React from 'react';
import { usePRDetail, useSession, useOrgContext } from '@workspace/hooks';
import { Button, Badge, Modal, DiffViewer, RoleGate, cn } from '@workspace/ui-kit';
import { prs } from '@workspace/api-client';
import { ArrowLeft, Send, CheckCircle2, XCircle, ShieldAlert, AlertTriangle, FileDiff } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';

export default function PRDetailPage() {
  const params = useParams();
  const prId = String(params.prId);
  const { orgId, isGuestView } = useOrgContext();
  const { data: session } = useSession();
  const router = useRouter();

  const { data: pr, isLoading, refetch } = usePRDetail(orgId, prId);
  const [comments, setComments] = React.useState<any[]>([]);
  const [newComment, setNewComment] = React.useState('');
  const [isPosting, setIsPosting] = React.useState(false);

  // Review Verdict state
  const [isRejectModalOpen, setIsRejectModalOpen] = React.useState(false);
  const [rejectReason, setRejectReason] = React.useState('');
  const [isReviewing, setIsReviewing] = React.useState(false);

  const fetchComments = React.useCallback(async () => {
    if (!orgId || !prId) return;
    try {
      const list = await prs.listComments(orgId, prId);
      setComments(list || []);
    } catch (e) {
      console.error(e);
    }
  }, [orgId, prId]);

  React.useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleApprove = async () => {
    setIsReviewing(true);
    try {
      await prs.review(orgId, prId, 'APPROVED');
      refetch();
    } catch (err: any) {
      alert(`Review Error (§11.5 / §26 Edge Case 4): ${err.message}`);
    } finally {
      setIsReviewing(false);
    }
  };

  const handleRequestChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectReason.trim()) {
      alert('Mandatory feedback note required when requesting changes (§11.4 / §26 Edge Case 4)');
      return;
    }
    setIsReviewing(true);
    try {
      await prs.review(orgId, prId, 'CHANGES_REQUESTED', rejectReason.trim());
      setIsRejectModalOpen(false);
      setRejectReason('');
      refetch();
    } catch (err: any) {
      alert(`Review Error: ${err.message}`);
    } finally {
      setIsReviewing(false);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setIsPosting(true);
    try {
      await prs.createComment(orgId, prId, newComment.trim());
      setNewComment('');
      fetchComments();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsPosting(false);
    }
  };

  if (isLoading || !pr) {
    return (
      <div className="w-full h-96 rounded-3xl bg-zinc-900/40 border border-white/10 animate-pulse flex items-center justify-center text-zinc-500">
        Loading PR Review Engine...
      </div>
    );
  }

  const isAuthor = session?.user.id === pr.authorId;
  const approvedCount = (pr.reviews || []).filter((r) => r.verdict === 'APPROVED').length;
  const required = pr.requiredApprovals || 1;

  // Mock code diff representing PR modifications (§12.2)
  const mockDiffData = [
    { value: '@@ -12,6 +12,8 @@ class OrganizationController {\n  async createInvite(req: Request, res: Response) {\n    const { email, role } = req.body;' },
    { removed: true, value: '-    const invite = await this.service.sendInvite(email, role);\n-    return res.json({ status: "ok" });' },
    { added: true, value: '+    // Strict tenant boundary checking per §5.4\n+    const invite = await this.service.sendInvite(req.orgContext!.orgId!, email, role);\n+    return res.status(201).json({ status: "ok", invite });' },
    { value: '  }\n}' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in-50">
      <div className="flex items-center justify-between">
        <button onClick={() => router.push('/prs')} className="inline-flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to PR Board</span>
        </button>

        {/* Floating Review Action Toolbar (§11.4 / §11.5) */}
        {!isGuestView && (
          <RoleGate permission="pr:review">
            {isAuthor ? (
              <span className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4" />
                <span>Author cannot approve own PR (§11.5)</span>
              </span>
            ) : pr.status !== 'MERGED' ? (
              <div className="flex items-center gap-3">
                <Button variant="secondary" size="sm" onClick={() => setIsRejectModalOpen(true)} disabled={isReviewing} className="border-rose-500/30 hover:bg-rose-500/20 text-rose-300">
                  <XCircle className="w-4 h-4 text-rose-400" />
                  <span>Request Changes (§11.4)</span>
                </Button>
                <Button variant="primary" size="sm" onClick={handleApprove} isLoading={isReviewing} className="bg-gradient-to-r from-emerald-600 to-emerald-500 border-emerald-400/30 shadow-emerald-500/20">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approve Pull Request</span>
                </Button>
              </div>
            ) : null}
          </RoleGate>
        )}
      </div>

      {/* PR Title & Status Header */}
      <div className="rounded-3xl border border-white/10 bg-zinc-900/60 p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <Badge status={pr.status} />
              <span className="px-3 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono font-bold text-xs border border-indigo-500/30">
                {approvedCount} of {required} Approvals (§11.3)
              </span>
              <span className="text-xs font-mono text-zinc-500">Version #{pr.version}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white">{pr.title}</h1>
          </div>

          <div className="text-left sm:text-right text-xs space-y-1 bg-zinc-950 p-3.5 rounded-2xl border border-white/10 flex-shrink-0">
            <p className="text-zinc-400">Author: <span className="font-bold text-purple-400">{pr.author?.fullName || 'Developer'}</span></p>
            <p className="text-zinc-500">Target: <span className="font-mono text-cyan-400">main</span> ← <span className="font-mono text-emerald-400">feature/auth-pool</span></p>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Description & Context</h3>
          <div className="p-5 rounded-2xl bg-zinc-950/90 border border-white/10 text-sm text-zinc-200 leading-relaxed font-mono whitespace-pre-wrap">
            {pr.description}
          </div>
        </div>

        {/* Immutable Version Diff Inspection (§12.1 / §12.2) */}
        <div className="space-y-3 pt-4 border-t border-white/10">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
              <FileDiff className="w-4 h-4 text-purple-400" />
              <span>Immutable Version Diff Inspector (§12.2)</span>
            </h3>
            <span className="text-[11px] font-mono bg-zinc-800 px-2.5 py-1 rounded-md text-zinc-400">
              Viewing commit hash #a8f3b21
            </span>
          </div>
          <DiffViewer diffData={mockDiffData} />
        </div>
      </div>

      {/* Comment Thread */}
      <div className="rounded-3xl border border-white/10 bg-zinc-900/40 p-6 sm:p-8 shadow-xl backdrop-blur-md space-y-6">
        <h2 className="text-base font-extrabold text-white flex items-center gap-2">
          <span>Review Activity & Comments ({comments.length})</span>
        </h2>

        <div className="space-y-4 divide-y divide-white/5">
          {comments.length === 0 ? (
            <p className="text-xs text-zinc-500 italic py-4">No comments posted yet. Leave review feedback below.</p>
          ) : (
            comments.map((c: any) => (
              <div key={c.id} className="pt-4 flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                  {c.author?.fullName ? c.author.fullName.charAt(0) : 'U'}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-200">{c.author?.fullName || 'Reviewer'}</span>
                    <span className="text-[10px] font-mono text-zinc-500">{new Date(c.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-sm text-zinc-300 bg-zinc-950 p-3.5 rounded-2xl border border-white/10 leading-relaxed">{c.body}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <form onSubmit={handlePostComment} className="pt-4 border-t border-white/10 flex gap-3">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={isGuestView ? "Add a guest feedback note..." : "Leave review comment..."}
            className="flex-1 h-24 p-3 rounded-2xl bg-zinc-950 border border-white/10 text-sm text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-purple-500/60"
          />
          <Button type="submit" variant="primary" className="h-auto px-6 rounded-2xl bg-purple-600 hover:bg-purple-500" isLoading={isPosting}>
            <Send className="w-4 h-4" />
            <span>Post Comment</span>
          </Button>
        </form>
      </div>

      {/* Request Changes Modal (§11.4 / §26) */}
      <Modal isOpen={isRejectModalOpen} onClose={() => setIsRejectModalOpen(false)} title="Request Changes (§11.4)">
        <form onSubmit={handleRequestChanges} className="space-y-4">
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
            <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0" />
            <p>Requesting changes transitions this PR to REJECTED and blocks merge until issues are addressed. Mandatory reason note required per §26 Edge Case 4.</p>
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-zinc-300 uppercase">Reason for Rejection / Requested Changes</label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Explain required code fixes or failing security checks..."
              className="w-full h-28 p-3 rounded-xl bg-zinc-900 border border-white/10 text-sm text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-rose-500"
              required
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setIsRejectModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="destructive" isLoading={isReviewing}>Submit Requested Changes</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
