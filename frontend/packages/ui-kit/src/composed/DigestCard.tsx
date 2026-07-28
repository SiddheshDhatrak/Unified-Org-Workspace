import React from 'react';
import { useLatestDigest, useFeatureFlag, useOrgContext } from '@workspace/hooks';
import { Sparkles, Bot, Clock, ExternalLink } from 'lucide-react';

/**
 * AI Progress Tracker Digest Widget (§15.1 / §15.2)
 * Verbatim LLM copy display with glowing cyan/purple AI aesthetic.
 */
export const DigestCard: React.FC = () => {
  const { orgId } = useOrgContext();
  const aiEnabled = useFeatureFlag(orgId, 'enable-ai-digest');
  const { data: digest, isLoading } = useLatestDigest(orgId);

  // Hidden entirely when feature flag is off per §17.2
  if (!aiEnabled || !orgId) return null;

  if (isLoading) {
    return (
      <div className="w-full rounded-2xl border border-white/10 bg-zinc-900/60 p-6 shadow-xl animate-pulse flex items-center justify-between mb-6">
        <div className="space-y-2 w-3/4">
          <div className="h-4 bg-white/10 rounded w-1/3" />
          <div className="h-4 bg-white/5 rounded w-full" />
        </div>
      </div>
    );
  }

  const content = digest?.content || 'Your first AI progress digest will arrive on your organization schedule (§15.4).';
  const timeStr = digest?.generatedAt ? new Date(digest.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now';

  return (
    <div className="relative overflow-hidden w-full rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-surface via-zinc-900 to-indigo-950/40 p-6 shadow-2xl backdrop-blur-xl mb-6 group transition-all duration-300 hover:border-cyan-400/50 hover:shadow-[0_0_25px_rgba(6,182,212,0.15)]">
      {/* Background radial glow */}
      <div className="absolute -top-24 -left-24 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-purple-600 p-[1px] shadow-lg shadow-cyan-500/20 flex-shrink-0">
            <div className="w-full h-full bg-zinc-950/90 rounded-2xl flex items-center justify-center text-cyan-400">
              <Bot className="w-6 h-6 animate-pulse" style={{ animationDuration: '3s' }} />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-extrabold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-300 to-purple-400 uppercase">
                AI Progress Tracker (§15.1)
              </h3>
            </div>
            <p className="text-sm font-medium text-zinc-100 leading-relaxed max-w-3xl">
              {content}
            </p>
          </div>
        </div>

        <div className="flex sm:flex-col items-end justify-between w-full sm:w-auto gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-white/10 flex-shrink-0">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[11px] font-mono text-zinc-400">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Updated {timeStr}</span>
          </span>
        </div>
      </div>
    </div>
  );
};
