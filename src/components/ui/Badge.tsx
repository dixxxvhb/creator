import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-electric-500/15 text-electric-400 border-electric-500/25',
  info: 'bg-electric-500/15 text-electric-400 border-electric-500/25',
  success: 'bg-success-500/15 text-success-500 border-success-500/25',
  warning: 'bg-warning-500/15 text-warning-500 border-warning-500/25',
  danger: 'bg-danger-500/15 text-danger-500 border-danger-500/25',
};

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        variantStyles[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
