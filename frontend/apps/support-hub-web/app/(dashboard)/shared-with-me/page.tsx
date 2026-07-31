'use client';
import React from 'react';
import { useOrgContext } from '@workspace/hooks';
import { Badge, EmptyState } from '@workspace/ui-kit';
import { Share2, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { connections } from '@workspace/api-client';
import { useQuery } from '@tanstack/react-query';

export default function SharedWithMePage() {
  const { orgId } = useOrgContext();
  const router = useRouter();

  // Fetch real cross-org connections — tickets shared with us appear via guest view
  const { data: orgConnections, isLoading } = useQuery({
    queryKey: ['org-scoped', orgId, 'connections'],
    queryFn: () => connections.list(orgId),
    enabled: Boolean(orgId),
  });

  const approvedConnections = (orgConnections || []).filter((c: any) => c.status === 'APPROVED');

  return (
    <div className="max-w-5xl mx-auto space-y-6 page-enter">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/8">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <Share2 className="w-4 h-4 text-cyan-400" />
            </div>
            <h1 className="text-xl font-extrabold text-white">Partner Shared Items</h1>
          </div>
          <p className="text-xs text-zinc-500 ml-11">
            Items shared across organization boundaries. Click any shared ticket to enter Guest View Mode.
          </p>
        </div>
      </div>

      {/* Connected Organizations */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Connected Organizations</h2>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map(i => <div key={i} className="h-16 rounded-2xl shimmer" />)}
          </div>
        ) : approvedConnections.length === 0 ? (
          <EmptyState
            title="No Partner Connections"
            subtitle="Your organization has no approved cross-org connections. Ask an admin to establish a partnership."
          />
        ) : (
          <div className="space-y-2.5">
            {approvedConnections.map((conn: any) => {
              const partnerOrg = conn.requestingOrgId === orgId ? conn.partnerOrg : conn.requestingOrg;
              return (
                <div
                  key={conn.id}
                  className="flex items-center justify-between p-4 rounded-2xl border border-white/8 bg-[#0D1525]/80 hover:border-cyan-500/25 transition-all group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 border border-white/10 flex items-center justify-center text-cyan-300 font-bold text-sm">
                      {partnerOrg?.name?.[0] || '?'}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{partnerOrg?.name || 'Partner Organization'}</p>
                      <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
                        Slug: {partnerOrg?.slug || 'unknown'} · Approved Partnership
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Badge status="ACTIVE" />
                    <button
                      onClick={() => router.push('/tickets')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-300 text-xs font-semibold transition-all"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      View Shared Items
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Info Banner */}
      <div className="p-4 rounded-2xl bg-cyan-500/5 border border-cyan-500/15 text-xs text-zinc-400 leading-relaxed">
        <p className="font-semibold text-cyan-300 mb-1">About Guest View Mode</p>
        When a partner org shares a ticket with you, you access it in restricted Guest View. You can read the ticket and post comments, but cannot change its status or access private metadata.
      </div>
    </div>
  );
}
