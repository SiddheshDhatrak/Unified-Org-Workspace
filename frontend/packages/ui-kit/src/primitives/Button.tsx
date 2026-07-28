import React from 'react';
import { cn } from '../utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'destructive' | 'ghost' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    const variants = {
      primary: 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/25 hover:from-indigo-500 hover:to-indigo-400 border border-indigo-400/30',
      secondary: 'bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 border border-white/10 shadow-sm',
      destructive: 'bg-gradient-to-r from-rose-600 to-rose-500 text-white shadow-lg shadow-rose-500/25 hover:from-rose-500 hover:to-rose-400 border border-rose-400/30',
      ghost: 'bg-transparent hover:bg-white/5 text-zinc-300 hover:text-white',
      glass: 'bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/20 text-white shadow-glass',
    };

    const sizes = {
      sm: 'h-8 px-3 text-xs rounded-md font-medium',
      md: 'h-10 px-4 py-2 text-sm rounded-lg font-medium',
      lg: 'h-12 px-6 py-3 text-base rounded-xl font-semibold',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center gap-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin text-current" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
