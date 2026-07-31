'use client';
import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { auth, ApiError } from '@workspace/api-client';
import { Button, Input, cn } from '@workspace/ui-kit';
import { ShieldCheck, Lock, ArrowRight, GitPullRequest, Code2, GitMerge, FileCheck2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});
type LoginFormValues = z.infer<typeof loginSchema>;



const FEATURES = [
  { icon: FileCheck2, label: 'Intelligent PR Review', desc: 'Accelerated peer reviews with multi-approval workflows' },
  { icon: Code2, label: 'Version Diff Inspector', desc: 'Granular code comparison with inline annotations' },
  { icon: GitMerge, label: 'Strict Merge Gates', desc: 'Enforce organizational policies before merging' },
];

function LoginContent() {
  const searchParams = useSearchParams();
  const from = searchParams?.get('from') || '/prs';
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await auth.login(data);
      window.location.href = from;
    } catch (err: any) {
      setErrorMessage(err instanceof ApiError ? err.message : 'Invalid email or password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-[var(--bg)]">
      {/* Left Branding Panel */}
      <div className="hidden lg:flex flex-col justify-between w-[480px] shrink-0 p-10 border-r border-[var(--border)] bg-[var(--surface)] relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl bg-[var(--accent)] flex items-center justify-center shadow-sm">
              <GitPullRequest className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-[var(--text-primary)]">Review Console</p>
              <p className="text-[10px] font-mono text-[var(--text-tertiary)] uppercase tracking-widest">Unified Org Workspace</p>
            </div>
          </div>

          <h2 className="text-3xl font-bold leading-tight mb-3 text-[var(--text-primary)]">
            Code Review,<br />
            <span className="text-[var(--accent)]">Elevated.</span>
          </h2>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-10">
            Secure, efficient, and scalable pull request management for modern engineering teams.
          </p>

          <div className="space-y-6">
            {FEATURES.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-lg bg-[var(--accent-light)] flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="w-4 h-4 text-[var(--accent)]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{label}</p>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 mt-12">
          <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)]">
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              <span className="text-[var(--text-primary)] font-semibold">Strict Governance</span> - Immutable audit trails and policy-driven merge conditions.
            </p>
          </div>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-[var(--accent)] flex items-center justify-center">
              <GitPullRequest className="w-4.5 h-4.5 text-white" />
            </div>
            <p className="text-base font-bold text-[var(--text-primary)]">Review Console</p>
          </div>

          <div>

            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Welcome back</h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">Sign in to your workspace to continue.</p>
          </div>

          {errorMessage && (
            <div className="flex items-center gap-2.5 p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 dark:bg-red-950/30 dark:border-red-900/50 dark:text-red-400 text-sm">
              <Lock className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              label="Email Address"
              type="email"
              placeholder="alice@acme.com"
              {...register('email')}
              error={errors.email?.message}
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••••••"
              {...register('password')}
              error={errors.password?.message}
            />
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2 group"
              isLoading={isSubmitting}
            >
              <span>Continue to Dashboard</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1 ml-1" />
            </Button>
          </form>


        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[var(--bg)] text-[var(--text-secondary)]">Loading...</div>}>
      <LoginContent />
    </React.Suspense>
  );
}
