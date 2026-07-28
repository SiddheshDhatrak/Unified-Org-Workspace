'use client';
import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { auth, ApiError } from '@workspace/api-client';
import { Button, Input, cn } from '@workspace/ui-kit';
import { ShieldCheck, Lock, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid work email'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await auth.login(data);
      router.replace('/tickets');
    } catch (err: any) {
      // Deliberately field-agnostic error per PRD §4.1 to avoid user enumeration!
      setErrorMessage(err instanceof ApiError ? err.message : 'Invalid email or password');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 relative overflow-hidden bg-background">
      {/* Background radial atmosphere */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/15 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative w-full max-w-md p-8 rounded-3xl border border-white/10 bg-zinc-900/70 shadow-2xl backdrop-blur-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 via-indigo-600 to-cyan-400 p-[1px] shadow-lg shadow-indigo-500/30 mb-2">
            <div className="w-full h-full bg-zinc-950 rounded-2xl flex items-center justify-center text-indigo-400">
              <ShieldCheck className="w-7 h-7 animate-pulse" style={{ animationDuration: '4s' }} />
            </div>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">Sign in to Support Hub</h1>
          <p className="text-xs text-zinc-400">Unified Org Workspace — SSO Enabled (§1.2)</p>
        </div>

        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2">
            <Lock className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Work Email"
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

          <Button type="submit" variant="primary" size="lg" className="w-full mt-2 group" isLoading={isSubmitting}>
            <span>Continue to Dashboard</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </form>

        <div className="pt-4 border-t border-white/10 text-center">
          <p className="text-xs text-zinc-500">
            Don&apos;t have an account yet?{' '}
            <a href="/register" className="font-bold text-indigo-400 hover:text-indigo-300 transition-colors">
              Register an organization
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
