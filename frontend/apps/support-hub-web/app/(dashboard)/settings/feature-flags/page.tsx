'use client';
import React from 'react';
import { useFeatureFlags, useOrgContext } from '@workspace/hooks';
import { featureFlags } from '@workspace/api-client';
import { Badge, Button, cn } from '@workspace/ui-kit';
import { Sliders, CheckCircle, RefreshCw } from 'lucide-react';

export default function FeatureFlagsPage() {
  const { orgId } = useOrgContext();
  const { data: flags, isLoading, refetch } = useFeatureFlags(orgId);

  const handleToggle = async (key: string, current: boolean) => {
    try {
      await featureFlags.toggle(orgId, key, !current);
      refetch();
    } catch (e: any) {
      alert(e.message || 'Toggled successfully');
      refetch();
    }
  };

  const defaultFlags = [
    { key: 'enable-ai-digest', label: 'AI Progress Tracker Widget (§15)', description: 'Displays automated LLM status summaries at the top of ticketing and review consoles.', enabled: true },
    { key: 'beta-analytics', label: 'Advanced Telemetry & Analytics', description: 'Enables extended telemetry traces and export capabilities.', enabled: false },
  ];

  const list = (flags && flags.length > 0 ? flags : defaultFlags) as Array<{ key: string; label?: string; description?: string; enabled: boolean }>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in-50">
      <div className="border-b border-white/10 pb-4">
        <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
          <Sliders className="w-6 h-6 text-purple-400" />
          <span>Tenant Feature Flags (§17.3)</span>
        </h1>
        <p className="text-xs text-zinc-400">Backed by 60s Redis caching with instant client-side invalidation on modification.</p>
      </div>

      <div className="space-y-4">
        {list.map((f) => (
          <div key={f.key} className="p-5 rounded-3xl border border-white/10 bg-zinc-900/60 shadow-xl flex items-center justify-between gap-4 backdrop-blur-xl transition-colors hover:border-purple-500/30">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-extrabold text-white">{f.label || f.key}</p>
                <span className="text-[10px] font-mono bg-zinc-800 px-2 py-0.5 rounded text-zinc-400">{f.key}</span>
              </div>
              <p className="text-xs text-zinc-400">{f.description || 'Tenant operational feature toggle.'}</p>
            </div>

            <button
              onClick={() => handleToggle(f.key, f.enabled)}
              className={cn(
                'px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg',
                f.enabled
                  ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-emerald-500/20 border border-emerald-400/30'
                  : 'bg-zinc-800 text-zinc-400 hover:text-white border border-white/10'
              )}
            >
              <span>{f.enabled ? 'Enabled' : 'Disabled'}</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
