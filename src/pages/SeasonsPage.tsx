import { Trophy } from 'lucide-react';
import { PageContainer } from '@/components/layout';
import { Card } from '@/components/ui/Card';

export function SeasonsPage() {
  return (
    <PageContainer title="Seasons">
      <Card className="text-center py-12">
        <Trophy size={40} className="mx-auto text-text-tertiary mb-4" />
        <h3 className="text-lg font-semibold text-text-primary mb-2">Coming Soon</h3>
        <p className="text-sm text-text-tertiary max-w-md mx-auto">
          Organize competitions, track awards, and plan your season.
        </p>
      </Card>
    </PageContainer>
  );
}
