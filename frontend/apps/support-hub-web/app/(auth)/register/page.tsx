'use client';
import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { auth, ApiError } from '@workspace/api-client';
import { Button, Input, cn } from '@workspace/ui-kit';
import { ShieldCheck, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Please enter a valid work email'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  organizationName: z.string().min(2, 'Organization name is required'),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const { register, watch, handleSubmit, formState: { errors } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const passwordValue = watch('password') || '';

  // Simple simulated zxcvbn password strength indicator (§4.2)
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

  const onSubmit = async (data: RegisterFormValues) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await auth.register({
        email: data.email,
        password: data.password,
        fullName: data.fullName,
        organizationName: data.organizationName,
      });
      router.replace('/tickets');
    } catch (err: any) {
      setErrorMessage(err instanceof ApiError ? err.message : 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 relative overflow-hidden bg-background">
      <div className="absolute top-1/3 right-1/3 w-96 h-96 bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/3 left-1/3 w-96 h-96 bg-purple-600/15 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative w-full max-w-md p-8 rounded-3xl border border-white/10 bg-zinc-900/70 shadow-2xl backdrop-blur-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-400 to-indigo-600 p-[1px] mb-1">
            <div className="w-full h-full bg-zinc-950 rounded-2xl flex items-center justify-center text-cyan-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">Create Workspace</h1>
          <p className="text-xs text-zinc-400">Support Hub & Review Console Unified Access (§4.1)</p>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
          <Input label="Full Name" placeholder="Alice Acme" {...register('fullName')} error={errors.fullName?.message} />
          <Input label="Work Email" placeholder="alice@acme.com" {...register('email')} error={errors.email?.message} />
          <Input label="Organization Name" placeholder="Acme Corp" {...register('organizationName')} error={errors.organizationName?.message} />
          
          <div className="space-y-1">
            <Input label="Password" type="password" placeholder="Password123!" {...register('password')} error={errors.password?.message} />
            {passwordValue.length > 0 && (
              <div className="pt-1.5 space-y-1">
                <div className="flex justify-between items-center text-[11px] font-semibold text-zinc-400">
                  <span>Password Strength (§4.2)</span>
                  <span className={cn('font-bold', strengthScore >= 3 ? 'text-emerald-400' : 'text-amber-400')}>{strengthText}</span>
                </div>
                <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden flex gap-1">
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
            <span>Create Account & Org</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </form>

        <div className="pt-3 border-t border-white/10 text-center">
          <p className="text-xs text-zinc-500">
            Already have an account?{' '}
            <a href="/login" className="font-bold text-indigo-400 hover:text-indigo-300 transition-colors">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
