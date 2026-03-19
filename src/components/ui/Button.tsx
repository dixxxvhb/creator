import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Spinner } from './Spinner';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'text-white hover:opacity-90 active:opacity-80',
  secondary:
    'bg-surface-secondary text-text-primary hover:bg-border active:bg-border',
  ghost:
    'bg-transparent text-text-secondary hover:bg-surface-secondary hover:text-text-primary active:bg-surface-secondary',
  danger:
    'bg-danger-500 text-white hover:bg-danger-600 active:bg-danger-600',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-6 py-2.5 text-base gap-2',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className,
  children,
  style,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center rounded-xl font-medium transition-colors',
        'focus:outline-none focus-ring-accent',
        'disabled:opacity-50',
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      style={
        variant === 'primary'
          ? { backgroundColor: 'var(--color-accent)', ...style }
          : style
      }
      {...props}
    >
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  );
}
