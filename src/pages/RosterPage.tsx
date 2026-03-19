import { Users } from 'lucide-react';
import { PageContainer } from '@/components/layout';
import { Card } from '@/components/ui/Card';

export function RosterPage() {
  return (
    <PageContainer title="Roster">
      <Card className="text-center py-12">
        <Users size={40} className="mx-auto text-slate-600 mb-4" />
        <h3 className="text-lg font-semibold text-slate-300 mb-2">Coming Soon</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Manage your studio's dancers, measurements, and assignments.
        </p>
      </Card>
    </PageContainer>
  );
}
