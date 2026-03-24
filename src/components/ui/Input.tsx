import type { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, className, id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-text-secondary"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          'w-full rounded-xl border bg-surface px-3.5 py-2.5 text-sm text-text-primary',
          'border-border-light',
          'placeholder:text-text-tertiary',
          'focus:outline-none focus-ring-accent focus:border-transparent',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'transition-all duration-150',
          'min-h-[44px]',
          error && 'border-danger-500 focus:ring-danger-500/50 focus:border-danger-500',
          className,
        )}
        {...props}
      />
      {hint && !error && <p className="text-xs text-text-tertiary">{hint}</p>}
      {error && <p className="text-xs text-danger-500">{error}</p>}
    </div>
  );
}
