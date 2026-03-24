import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/Card';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <Card className="text-center py-16 px-6">
      <div className="w-14 h-14 rounded-2xl bg-surface-secondary flex items-center justify-center mx-auto mb-5">
        <Icon size={28} className="text-text-tertiary" />
      </div>
      <h3 className="font-display text-xl font-semibold text-text-primary mb-2">{title}</h3>
      <p className="text-sm text-text-tertiary max-w-sm mx-auto mb-6 leading-relaxed">
        {description}
      </p>
      {action}
    </Card>
  );
}
