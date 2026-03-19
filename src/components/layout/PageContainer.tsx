import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageContainerProps {
  title?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  fullWidth?: boolean;
}

export function PageContainer({
  title,
  actions,
  children,
  className,
  fullWidth = false,
}: PageContainerProps) {
  return (
    <div
      className={cn(
        'pb-24 md:pb-8 bg-surface-secondary min-h-full',
        !fullWidth && 'max-w-6xl mx-auto w-full',
        className,
      )}
    >
      {(title || actions) && (
        <div className="sticky top-0 z-10 glass border-b border-border/50 px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between gap-4">
            {title && (
              <h1 className="text-xl font-bold text-text-primary tracking-tight">
                {title}
              </h1>
            )}
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>
        </div>
      )}
      <div className="p-4 sm:p-6 lg:p-8">
        {children}
      </div>
    </div>
  );
}
