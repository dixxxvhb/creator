import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
  children: ReactNode;
  className?: string;
  header?: ReactNode;
  footer?: ReactNode;
  interactive?: boolean;
}

export function Card({ children, className, header, footer, interactive }: CardProps) {
  return (
    <div
      className={cn(
        'bg-surface-elevated rounded-2xl border border-border-light',
        'shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02)]',
        interactive && 'card-interactive cursor-pointer',
        className,
      )}
    >
      {header && (
        <div className="px-5 py-4 border-b border-border-light">{header}</div>
      )}
      <div className="px-5 py-4">{children}</div>
      {footer && (
        <div className="px-5 py-3 border-t border-border-light bg-surface-secondary/30">
          {footer}
        </div>
      )}
    </div>
  );
}
