'use client';
import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#090D16] flex items-center justify-center p-6">
        <div className="max-w-md w-full space-y-6 text-center">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-rose-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
            <p className="text-sm text-zinc-400">
              {error.message || 'An unexpected error occurred. The backend server may not be running.'}
            </p>
          </div>
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 text-indigo-300 text-sm font-bold transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
          <p className="text-xs text-zinc-500">
            Make sure the backend server is running on <code className="text-zinc-400">http://localhost:4000</code>
          </p>
        </div>
      </body>
    </html>
  );
}
