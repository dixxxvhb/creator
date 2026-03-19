import type { ReactNode, CSSProperties } from 'react';
import { cn } from '@/lib/utils';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: '',
  info: '',
  success: 'bg-success-500/15 text-success-500 border-success-500/25',
  warning: 'bg-warning-500/15 text-warning-500 border-warning-500/25',
  danger: 'bg-danger-500/15 text-danger-500 border-danger-500/25',
};

const accentStyle: CSSProperties = {
  backgroundColor: 'var(--color-accent-light)',
  color: 'var(--color-accent)',
  borderColor: 'var(--color-accent-light)',
};

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  const useAccent = variant === 'default' || variant === 'info';

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        variantStyles[variant],
        className,
      )}
      style={useAccent ? accentStyle : undefined}
    >
      {children}
    </span>
  );
}
