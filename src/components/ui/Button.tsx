import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Spinner } from './Spinner';
import { buttonTap } from '@/lib/motion';

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
    'text-white shadow-sm hover:shadow-md active:shadow-sm',
  secondary:
    'bg-surface-secondary text-text-primary border border-border hover:bg-border-light active:bg-border',
  ghost:
    'bg-transparent text-text-secondary hover:bg-surface-secondary hover:text-text-primary active:bg-border-light',
  danger:
    'bg-danger-500 text-white hover:bg-danger-600 active:bg-danger-600 shadow-sm',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm gap-1.5 rounded-lg min-h-[32px]',
  md: 'px-4 py-2.5 text-sm gap-2 rounded-xl min-h-[40px]',
  lg: 'px-6 py-3 text-base gap-2 rounded-xl min-h-[48px]',
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
    <motion.div {...buttonTap} className="inline-flex">
      <button
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center font-medium transition-all duration-150',
          'focus:outline-none focus-ring-accent',
          'disabled:opacity-50 disabled:pointer-events-none',
          variant === 'primary' && 'accent-glow',
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
    </motion.div>
  );
}
