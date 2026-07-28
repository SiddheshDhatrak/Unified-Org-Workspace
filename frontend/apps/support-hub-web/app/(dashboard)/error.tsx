'use client';
import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen w-full bg-[#090D16] flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-6 text-center">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-rose-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white mb-2">Connection Error</h2>
          <p className="text-sm text-zinc-400">
            Could not connect to the workspace backend. Please ensure the API server is running.
          </p>
        </div>
        <div className="p-3 rounded-xl bg-zinc-900/50 border border-white/5 text-left">
          <p className="text-xs text-zinc-500 font-mono">{error.message}</p>
        </div>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 text-indigo-300 text-sm font-bold transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          Retry Connection
        </button>
        <p className="text-xs text-zinc-500">
          Run <code className="text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded">npm run dev</code> in the backend directory
        </p>
      </div>
    </div>
  );
}
