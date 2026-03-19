import { Shirt } from 'lucide-react';
import { PageContainer } from '@/components/layout';
import { Card } from '@/components/ui/Card';

export function CostumesPage() {
  return (
    <PageContainer title="Costumes">
      <Card className="text-center py-12">
        <Shirt size={40} className="mx-auto text-slate-600 mb-4" />
        <h3 className="text-lg font-semibold text-slate-300 mb-2">Coming Soon</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Track costumes, accessories, and alterations for every piece.
        </p>
      </Card>
    </PageContainer>
  );
}
