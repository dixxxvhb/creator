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
        'bg-slate-800 border border-slate-700 rounded-xl overflow-hidden',
        className,
      )}
    >
      {header && (
        <div className="px-5 py-4 border-b border-slate-700">{header}</div>
      )}
      <div className="px-5 py-4">{children}</div>
      {footer && (
        <div className="px-5 py-3 border-t border-slate-700 bg-slate-800/50">
          {footer}
        </div>
      )}
    </div>
  );
}
