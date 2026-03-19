import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Layers, Trophy, Users } from 'lucide-react';
import { PageContainer } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { PieceCard } from '@/components/pieces';
import { usePieceStore } from '@/stores/pieceStore';
import { useProfileStore } from '@/stores/profileStore';

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
  const displayName = useProfileStore((s) => s.displayName);
  const studioName = useProfileStore((s) => s.studioName);
  const customGreeting = useProfileStore((s) => s.customGreeting);

  useEffect(() => {
    load();
  }, [load]);

  const greeting = customGreeting
    || (displayName ? `Welcome back, ${displayName}` : 'Welcome back');

  const stats = [
    { label: 'Pieces', value: pieces.length, icon: Layers },
    { label: 'Seasons', value: 0, icon: Trophy },
    { label: 'Dancers', value: 0, icon: Users },
  ];

  return (
    <PageContainer>
      {/* CREATOR wordmark hero */}
      <div className="text-center pt-4 pb-8">
        <h1
          className="text-text-primary uppercase font-brand mb-3"
          style={{ fontWeight: 200, letterSpacing: '0.3em', fontSize: '2.5rem' }}
        >
          Creator
        </h1>
        <p className="text-sm text-text-tertiary tracking-wide">
          Choreography, visualized.
        </p>
      </div>

      {/* Studio branding + greeting */}
      <div className="text-center mb-8">
        {studioName && (
          <p className="text-xs font-semibold text-text-tertiary uppercase tracking-widest mb-1">
            {studioName}
          </p>
        )}
        <p className="text-lg font-semibold text-text-primary">{greeting}</p>
        <p className="text-sm text-text-secondary mt-1">{formatDate(new Date())}</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <div className="flex flex-col items-center gap-2 py-1">
              <div
                className="flex items-center justify-center w-10 h-10 rounded-xl accent-bg-light"
              >
                <Icon size={20} className="accent-text" />
              </div>
              <p className="text-2xl font-bold text-text-primary">{value}</p>
              <p className="text-xs font-medium text-text-secondary">{label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Recent Pieces */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-text-primary">Recent Pieces</h3>
          {pieces.length > 0 && (
            <Link
              to="/pieces"
              className="text-sm font-medium accent-text hover:opacity-80 transition-opacity"
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
          <Card className="text-center py-10">
            <Layers size={36} className="mx-auto text-text-tertiary mb-3" />
            <p className="text-text-secondary mb-4">
              No pieces yet. Start building your first choreography.
            </p>
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
