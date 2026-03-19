import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Layers, Trophy, Users } from 'lucide-react';
import { PageContainer } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { PieceCard } from '@/components/pieces';
import { usePieceStore } from '@/stores/pieceStore';

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function DashboardPage() {
  const pieces = usePieceStore((s) => s.pieces);
  const isLoading = usePieceStore((s) => s.isLoading);
  const load = usePieceStore((s) => s.load);

  useEffect(() => {
    load();
  }, [load]);

  const stats = [
    { label: 'Total Pieces', value: pieces.length, icon: Layers },
    { label: 'Total Seasons', value: 0, icon: Trophy },
    { label: 'Total Dancers', value: 0, icon: Users },
  ];

  return (
    <PageContainer>
      {/* Greeting */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-100 mb-1">Welcome back</h2>
        <p className="text-sm text-slate-400">{formatDate(new Date())}</p>
      </div>

      {/* Hero card */}
      <Card className="mb-8 relative overflow-hidden border-electric-500/20">
        <div className="absolute inset-0 bg-gradient-to-br from-electric-600/20 via-electric-500/10 to-transparent pointer-events-none" />
        <div className="relative py-2">
          <h3 className="text-lg font-semibold text-slate-100 mb-2">
            Your complete choreography studio
          </h3>
          <p className="text-sm text-slate-300 max-w-xl leading-relaxed">
            Build formations, map transitions, manage your season, and bring every piece
            to life — all in one place.
          </p>
        </div>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-electric-500/10">
                <Icon size={20} className="text-electric-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-100">{value}</p>
                <p className="text-xs text-slate-400">{label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Recent Pieces */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-100">Recent Pieces</h3>
          {pieces.length > 0 && (
            <Link
              to="/pieces"
              className="text-sm text-electric-400 hover:text-electric-300 transition-colors"
            >
              View all
            </Link>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : pieces.length === 0 ? (
          <Card className="text-center py-8">
            <Layers size={32} className="mx-auto text-slate-600 mb-3" />
            <p className="text-slate-400 mb-4">No pieces yet. Start building your first choreography.</p>
            <Link to="/pieces/new">
              <Button>
                <Plus size={16} />
                Create your first piece
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1">
            {pieces.slice(0, 6).map((piece) => (
              <div key={piece.id} className="min-w-[260px] max-w-[300px] shrink-0">
                <PieceCard piece={piece} />
              </div>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
