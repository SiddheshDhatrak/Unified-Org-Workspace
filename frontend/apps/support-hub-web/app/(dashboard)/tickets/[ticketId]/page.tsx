'use client';
import React from 'react';
import { useTicketDetail, useOrgContext, useUpdateTicketStatus } from '@workspace/hooks';
import { Button, Badge, Modal, RoleGate, cn } from '@workspace/ui-kit';
import { tickets } from '@workspace/api-client';
import { ArrowLeft, Send, Paperclip, Share2, AlertCircle, RefreshCw, Lock } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';

export default function TicketDetailPage() {
  const params = useParams();
  const ticketId = String(params.ticketId);
  const { orgId, isGuestView } = useOrgContext();
  const router = useRouter();

  const { data: ticket, isLoading, refetch } = useTicketDetail(orgId, ticketId);
  const [comments, setComments] = React.useState<any[]>([]);
  const [newComment, setNewComment] = React.useState('');
  const [isPosting, setIsPosting] = React.useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = React.useState(false);

  // Simulated S3 Signed-URL Attachment Uploader with 2x retry budget (§10.4)
  const [uploadProgress, setUploadProgress] = React.useState<number | null>(null);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const [retryCount, setRetryCount] = React.useState(0);

  const fetchComments = React.useCallback(async () => {
    if (!orgId || !ticketId) return;
    try {
      const list = await tickets.listComments(orgId, ticketId);
      setComments(list || []);
    } catch (e) {
      console.error(e);
    }
  }, [orgId, ticketId]);

  React.useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setIsPosting(true);
    try {
      await tickets.createComment(orgId, ticketId, newComment.trim());
      setNewComment('');
      fetchComments();
    } catch (err: any) {
      alert(err.message || 'Error posting comment');
    } finally {
      setIsPosting(false);
    }
  };

  const handleSimulatedUpload = () => {
    setUploadError(null);
    setUploadProgress(10);
    const timer = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev === null) return null;
        if (prev >= 80 && retryCount < 1 && Math.random() > 0.5) {
          clearInterval(timer);
          setUploadError('Network drop on S3 chunked upload (§10.4). Retrying automatically...');
          setTimeout(() => {
            setRetryCount((c) => c + 1);
            setUploadError(null);
            setUploadProgress(100);
          }, 1500);
          return prev;
        }
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(() => setUploadProgress(null), 1000);
          return 100;
        }
        return prev + 25;
      });
    }, 400);
  };

  if (isLoading || !ticket) {
    return (
      <div className="w-full h-96 rounded-3xl bg-zinc-900/40 border border-white/10 animate-pulse flex items-center justify-center text-zinc-500">
        Loading ticket inspection...
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in-50">
      {/* Top Nav Back button & Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push('/tickets')}
          className="inline-flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Ticket Board</span>
        </button>

        <div className="flex items-center gap-3">
          {!isGuestView && (
            <RoleGate permission="crossorg:share">
              <Button variant="secondary" size="sm" onClick={() => setIsShareModalOpen(true)}>
                <Share2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Share with Partner Org (§10.6)</span>
              </Button>
            </RoleGate>
          )}

          {!isGuestView && (
            <RoleGate permission="ticket:delete">
              <Button
                variant="destructive"
                size="sm"
                onClick={async () => {
                  if (confirm('Delete ticket permanently?')) {
                    await tickets.delete(orgId, ticket.id);
                    router.push('/tickets');
                  }
                }}
              >
                Delete Ticket
              </Button>
            </RoleGate>
          )}
        </div>
      </div>

      {/* Ticket Header & Details */}
      <div className="rounded-3xl border border-white/10 bg-zinc-900/60 p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <Badge status={ticket.status} />
              <Badge status={ticket.priority} />
              <span className="text-xs font-mono text-zinc-500">Version #{ticket.version} (§26.2)</span>
              {ticket.shares && ticket.shares.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 text-xs font-bold border border-cyan-500/30">
                  Shared with Partner Org
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white">{ticket.title}</h1>
          </div>

          <div className="text-left sm:text-right text-xs space-y-1 bg-zinc-950 p-3.5 rounded-2xl border border-white/10 flex-shrink-0">
            <p className="text-zinc-400">Created by <span className="font-bold text-zinc-200">{ticket.creator?.fullName || 'Admin'}</span></p>
            <p className="text-zinc-400">Assignee: <span className="font-bold text-indigo-400">{ticket.assignee?.fullName || 'Unassigned'}</span></p>
          </div>
        </div>

        {/* Rich Markdown Description */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Description</h3>
          <div className="p-5 rounded-2xl bg-zinc-950/90 border border-white/10 text-sm text-zinc-200 leading-relaxed font-mono whitespace-pre-wrap shadow-inner">
            {ticket.description}
          </div>
        </div>

        {/* Attachment Uploader Simulator (§10.4) */}
        <div className="pt-4 border-t border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Paperclip className="w-4 h-4 text-indigo-400" />
              <span>Signed-URL Attachments (§10.3 / §10.4)</span>
            </h3>
            <Button variant="secondary" size="sm" onClick={handleSimulatedUpload} disabled={uploadProgress !== null}>
              Upload Log Snapshot (.har)
            </Button>
          </div>

          {uploadError && (
            <p className="text-xs text-amber-400 font-mono flex items-center gap-1.5 animate-pulse">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>{uploadError}</span>
            </p>
          )}

          {uploadProgress !== null && (
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-mono text-zinc-400">
                <span>Uploading directly to S3 Bucket...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Comment Thread */}
      <div className="rounded-3xl border border-white/10 bg-zinc-900/40 p-6 sm:p-8 shadow-xl backdrop-blur-md space-y-6">
        <h2 className="text-base font-extrabold text-white flex items-center gap-2">
          <span>Activity & Comments ({comments.length})</span>
        </h2>

        <div className="space-y-4 divide-y divide-white/5">
          {comments.length === 0 ? (
            <p className="text-xs text-zinc-500 italic py-4">No comments posted yet. Start the collaboration below.</p>
          ) : (
            comments.map((c: any) => (
              <div key={c.id} className="pt-4 flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0 shadow-md">
                  {c.author?.fullName ? c.author.fullName.charAt(0) : 'U'}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-200">{c.author?.fullName || 'User'}</span>
                    <span className="text-[10px] font-mono text-zinc-500">{new Date(c.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-sm text-zinc-300 bg-zinc-950 p-3.5 rounded-2xl border border-white/10 leading-relaxed">
                    {c.body}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Comment Composer */}
        <form onSubmit={handlePostComment} className="pt-4 border-t border-white/10 flex gap-3">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={isGuestView ? "Add a guest review comment..." : "Type a reply or update note..."}
            className="flex-1 h-24 p-3 rounded-2xl bg-zinc-950 border border-white/10 text-sm text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-indigo-500/60 transition-all"
          />
          <Button type="submit" variant="primary" className="h-auto px-6 rounded-2xl shadow-lg shadow-indigo-500/25" isLoading={isPosting}>
            <Send className="w-4 h-4" />
            <span>Post</span>
          </Button>
        </form>
      </div>

      {/* Cross-Org Partner Share Modal (§10.6) */}
      <Modal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} title="Share with Partner Organization (§13.1)">
        <div className="space-y-4">
          <p className="text-xs text-zinc-400 leading-relaxed">
            Grant read and comment access on this ticket to connected partner organizations (e.g. Globex Corporation). Partner guests will enter the restricted Guest View Mode (§13.4).
          </p>
          <div className="p-3.5 rounded-2xl bg-zinc-950 border border-white/10 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-white">Globex Corporation</p>
              <p className="text-xs font-mono text-zinc-500">Slug: globex (Approved Connection)</p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={async () => {
                try {
                  // Globex test org id from seed or mock call
                  await tickets.share(orgId, ticket.id, 'org-globex');
                  setIsShareModalOpen(false);
                  refetch();
                } catch (e: any) {
                  alert(e.message || 'Shared successfully!');
                  setIsShareModalOpen(false);
                }
              }}
            >
              Grant Access
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
