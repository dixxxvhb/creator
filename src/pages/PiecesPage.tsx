import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Layers } from 'lucide-react';
import { PageContainer } from '@/components/layout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { PieceCard } from '@/components/pieces';
import { usePieceStore } from '@/stores/pieceStore';

export function PiecesPage() {
  const pieces = usePieceStore((s) => s.pieces);
  const isLoading = usePieceStore((s) => s.isLoading);
  const load = usePieceStore((s) => s.load);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <PageContainer
      title="Pieces"
      actions={
        <Link to="/pieces/new">
          <Button>
            <Plus size={16} />
            New Piece
          </Button>
        </Link>
      }
    >
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : pieces.length === 0 ? (
        <Card className="text-center py-12">
          <Layers size={40} className="mx-auto text-text-tertiary mb-4" />
          <h3 className="text-lg font-semibold text-text-primary mb-2">No pieces yet</h3>
          <p className="text-sm text-text-tertiary mb-6 max-w-md mx-auto">
            Create your first piece to start building formations and mapping choreography.
          </p>
          <Link to="/pieces/new">
            <Button>
              <Plus size={16} />
              Create Piece
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {pieces.map((piece) => (
            <PieceCard key={piece.id} piece={piece} />
          ))}
        </div>
      )}
    </PageContainer>
  );
}
