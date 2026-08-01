'use client';
import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { auth, ApiError } from '@workspace/api-client';
import { Button, Input, cn } from '@workspace/ui-kit';
import { Lock, ArrowRight, LifeBuoy, Users, Zap, Globe } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});
type LoginFormValues = z.infer<typeof loginSchema>;

const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Please enter a valid work email'),
  password: z.string().min(10, 'Password must be at least 10 characters long'),
  organizationName: z.string().optional(),
  invitationToken: z.string().optional(),
}).refine(data => data.organizationName || data.invitationToken, {
  message: 'Either Organization Name or Invitation Token is required',
  path: ['organizationName'],
});
type RegisterFormValues = z.infer<typeof registerSchema>;

const FEATURES = [
  { icon: LifeBuoy, label: 'Smart Ticket Management', desc: 'Unified queue with AI triage and priority scoring' },
  { icon: Users, label: 'Cross-Org Collaboration', desc: 'Share tickets with partner organizations securely' },
  { icon: Zap, label: 'Real-time Notifications', desc: 'Instant alerts on status changes and assignments' },
  { icon: Globe, label: 'Multi-Org Workspace', desc: 'Manage multiple organizations from a single account' },
];

function LoginContent() {
  const searchParams = useSearchParams();
  const from = searchParams?.get('from') || '/tickets';
  const inviteToken = searchParams?.get('token');
  
  const [mode, setMode] = React.useState<'login' | 'register'>(inviteToken ? 'register' : 'login');
  const [joinMode, setJoinMode] = React.useState<'create' | 'join'>(inviteToken ? 'join' : 'create');
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  React.useEffect(() => {
    if (inviteToken) {
      registerForm.setValue('invitationToken', inviteToken);
    }
  }, [inviteToken, registerForm]);

  const passwordValue = registerForm.watch('password') || '';
  const strengthScore = React.useMemo(() => {
    let score = 0;
    if (passwordValue.length >= 8) score += 1;
    if (passwordValue.length >= 12) score += 1;
    if (/[A-Z]/.test(passwordValue) && /[0-9]/.test(passwordValue)) score += 1;
    if (/[^A-Za-z0-9]/.test(passwordValue)) score += 1;
    return score;
  }, [passwordValue]);
  const strengthColor = ['bg-rose-500', 'bg-rose-500', 'bg-amber-500', 'bg-emerald-500', 'bg-emerald-400'][strengthScore];
  const strengthText = ['Very Weak', 'Weak', 'Moderate', 'Strong', 'Very Strong'][strengthScore];

  const onLoginSubmit = async (data: LoginFormValues) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await auth.login(data);
      window.location.href = from;
    } catch (err: any) {
      setErrorMessage(err instanceof ApiError ? err.message : 'Invalid email or password. Please try again.');
      setIsSubmitting(false);
    }
  };

  const onRegisterSubmit = async (data: RegisterFormValues) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await auth.register({
        email: data.email,
        password: data.password,
        fullName: data.fullName,
        organizationName: joinMode === 'create' ? data.organizationName : undefined,
        invitationToken: joinMode === 'join' ? data.invitationToken : undefined,
      });
      window.location.href = '/tickets';
    } catch (err: any) {
      setErrorMessage(err instanceof ApiError ? err.message : 'Registration failed. Please try again.');
      setIsSubmitting(false);
    }
  };

  const switchMode = (newMode: 'login' | 'register') => {
    setErrorMessage(null);
    loginForm.reset();
    registerForm.reset();
    setMode(newMode);
  };

  return (
    <div className="min-h-screen w-full flex bg-[var(--bg)]">
      {/* Left Branding Panel */}
      <div className="hidden lg:flex flex-col justify-between w-[480px] shrink-0 p-10 border-r border-[var(--border)] bg-[var(--surface)] relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl bg-[var(--accent)] flex items-center justify-center shadow-sm">
              <LifeBuoy className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-[var(--text-primary)]">Support Hub</p>
              <p className="text-[10px] font-mono text-[var(--text-tertiary)] uppercase tracking-widest">Unified Org Workspace</p>
            </div>
          </div>

          <h2 className="text-3xl font-bold leading-tight mb-3 text-[var(--text-primary)]">
            Enterprise Support,<br />
            <span className="text-[var(--accent)]">Unified.</span>
          </h2>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-10">
            Manage tickets, collaborate across organizations, and resolve issues faster with AI-powered insights.
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
      </div>

      {/* Right Form Panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 overflow-hidden relative">
        <div className="w-full max-w-md relative min-h-[500px]">
          
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-[var(--accent)] flex items-center justify-center">
              <LifeBuoy className="w-4.5 h-4.5 text-white" />
            </div>
            <p className="text-base font-bold text-[var(--text-primary)]">Support Hub</p>
          </div>

          {/* LOGIN FORM */}
          <div className={cn(
            "absolute top-0 w-full transition-all duration-500 ease-in-out",
            mode === 'login' ? "translate-x-0 opacity-100 pointer-events-auto" : "-translate-x-full opacity-0 pointer-events-none"
          )}>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">Welcome back</h1>
              <p className="text-sm text-[var(--text-secondary)] mt-1">Sign in to your workspace to continue.</p>
            </div>

            {errorMessage && mode === 'login' && (
              <div className="flex items-center gap-2.5 p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 dark:bg-red-950/30 dark:border-red-900/50 dark:text-red-400 text-sm mb-5">
                <Lock className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-5">
              <Input
                label="Email Address"
                type="email"
                placeholder="alice@acme.com"
                {...loginForm.register('email')}
                error={loginForm.formState.errors.email?.message}
              />
              <Input
                label="Password"
                type="password"
                placeholder="••••••••••••"
                {...loginForm.register('password')}
                error={loginForm.formState.errors.password?.message}
              />
              <Button type="submit" variant="primary" size="lg" className="w-full mt-2 group" isLoading={isSubmitting}>
                <span>Continue to Dashboard</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1 ml-1" />
              </Button>
            </form>

            <div className="pt-6 mt-6 border-t border-[var(--border)] text-center">
              <p className="text-sm text-[var(--text-secondary)]">
                Don&apos;t have an account?{' '}
                <button type="button" onClick={() => switchMode('register')} className="font-semibold text-[var(--accent)] hover:underline">
                  Register your organization
                </button>
              </p>
            </div>
          </div>

          {/* REGISTER FORM */}
          <div className={cn(
            "absolute top-0 w-full transition-all duration-500 ease-in-out",
            mode === 'register' ? "translate-x-0 opacity-100 pointer-events-auto" : "translate-x-full opacity-0 pointer-events-none"
          )}>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">Create Workspace</h1>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                {inviteToken ? "You've been invited! Create your account to join." : "Register your organization to get started."}
              </p>
            </div>

            {errorMessage && mode === 'register' && (
              <div className="flex items-center gap-2.5 p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 dark:bg-red-950/30 dark:border-red-900/50 dark:text-red-400 text-sm mb-5">
                <Lock className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-3.5">
              <Input label="Full Name" placeholder="Alice Acme" {...registerForm.register('fullName')} error={registerForm.formState.errors.fullName?.message} />
              <Input label="Work Email" placeholder="alice@acme.com" {...registerForm.register('email')} error={registerForm.formState.errors.email?.message} />
              
              <div className="flex bg-[var(--surface-hover)] rounded-lg p-1 border border-[var(--border)] mb-4">
                <button
                  type="button"
                  className={cn('flex-1 text-xs font-semibold py-1.5 rounded-md transition-all', joinMode === 'create' ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-secondary)]')}
                  onClick={() => setJoinMode('create')}
                >
                  Create New
                </button>
                <button
                  type="button"
                  className={cn('flex-1 text-xs font-semibold py-1.5 rounded-md transition-all', joinMode === 'join' ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-secondary)]')}
                  onClick={() => setJoinMode('join')}
                >
                  Join Existing
                </button>
              </div>

              {joinMode === 'create' ? (
                <Input label="Organization Name" placeholder="Acme Corp" {...registerForm.register('organizationName')} error={registerForm.formState.errors.organizationName?.message} />
              ) : (
                <Input label="Invitation Token" placeholder="Paste your token here" {...registerForm.register('invitationToken')} error={registerForm.formState.errors.invitationToken?.message} readOnly={!!inviteToken} className={inviteToken ? "opacity-50 cursor-not-allowed" : ""} />
              )}
              
              <div className="space-y-1">
                <Input label="Password" type="password" placeholder="Password123!" {...registerForm.register('password')} error={registerForm.formState.errors.password?.message} />
                {passwordValue.length > 0 && (
                  <div className="pt-1.5 space-y-1">
                    <div className="flex justify-between items-center text-[11px] font-semibold text-[var(--text-secondary)]">
                      <span>Password Strength</span>
                      <span className={cn('font-bold', strengthScore >= 3 ? 'text-emerald-500' : 'text-amber-500')}>{strengthText}</span>
                    </div>
                    <div className="w-full h-1.5 bg-[var(--border)] rounded-full overflow-hidden flex gap-1">
                      {[1, 2, 3, 4].map((step) => (
                        <div
                          key={step}
                          className={cn('flex-1 transition-all duration-300 rounded-full', step <= strengthScore ? strengthColor : 'bg-transparent')}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Button type="submit" variant="primary" size="lg" className="w-full mt-4 group" isLoading={isSubmitting}>
                <span>{joinMode === 'create' ? 'Create Account & Org' : 'Join Workspace'}</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1 ml-1" />
              </Button>
            </form>

            <div className="pt-6 mt-6 border-t border-[var(--border)] text-center">
              <p className="text-sm text-[var(--text-secondary)]">
                Already have an account?{' '}
                <button type="button" onClick={() => switchMode('login')} className="font-semibold text-[var(--accent)] hover:underline">
                  Sign in
                </button>
              </p>
            </div>
          </div>

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
