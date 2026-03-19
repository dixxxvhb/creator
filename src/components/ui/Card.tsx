import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
  children: ReactNode;
  className?: string;
  header?: ReactNode;
  footer?: ReactNode;
}

export function Card({ children, className, header, footer }: CardProps) {
  return (
    <div
      className={cn(
        'bg-surface-elevated rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-transparent dark:border-border overflow-hidden',
        className,
      )}
    >
      {header && (
        <div className="px-5 py-4 border-b border-border">{header}</div>
      )}
      <div className="px-5 py-4">{children}</div>
      {footer && (
        <div className="px-5 py-3 border-t border-border bg-surface-secondary/50">
          {footer}
        </div>
      )}
    </div>
  );
}
