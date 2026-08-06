import React from 'react';
import { useLatestDigest, useFeatureFlag, useOrgContext } from '@workspace/hooks';
import { Sparkles, Clock } from 'lucide-react';

export const DigestCard: React.FC = () => {
  const { orgId } = useOrgContext();
  const aiEnabled = useFeatureFlag(orgId, 'enable-ai-digest');
  const { data: digest, isLoading } = useLatestDigest(orgId);

  if (!aiEnabled || !orgId) return null;

  if (isLoading) {
    return (
      <div className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5 mb-5">
        <div className="space-y-2.5">
          <div className="h-3 w-1/3 rounded shimmer" />
          <div className="h-3 w-full rounded shimmer" />
        </div>
      </div>
    );
  }

  const rawContent = digest?.content;
  const isObject = typeof rawContent === 'object' && rawContent !== null;
  const content = (isObject && 'text' in (rawContent as any))
    ? (rawContent as any).text
    : (rawContent || 'Your first AI progress digest will arrive on your organization schedule.');
  const timeStr = digest?.generatedAt
    ? new Date(digest.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Just now';

  return (
    <div
      className="w-full rounded-lg border border-[var(--border)] bg-[var(--accent-light)] p-5 mb-5"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Sparkles className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'var(--accent)' }} />
          <div>
            <p className="text-xs font-semibold mb-1" style={{ color: 'var(--accent-text)' }}>AI Progress Digest</p>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>{content}</p>
          </div>
        </div>
        <span className="flex items-center gap-1 text-[11px] shrink-0" style={{ color: 'var(--text-tertiary)' }}>
          <Clock className="w-3 h-3" /> {timeStr}
        </span>
      </div>
    </div>
  );
};
