import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Layers } from 'lucide-react';
import { PageContainer } from '@/components/layout';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { SearchInput } from '@/components/shared/SearchInput';
import { PieceCard } from '@/components/pieces';
import { usePieceStore } from '@/stores/pieceStore';
import { useTierStore } from '@/stores/tierStore';
import { FREE_PIECE_LIMIT } from '@/types';
import { staggerContainer, staggerItem } from '@/lib/motion';

export function PiecesPage() {
  const pieces = usePieceStore((s) => s.pieces);
  const isLoading = usePieceStore((s) => s.isLoading);
  const load = usePieceStore((s) => s.load);
  const tier = useTierStore((s) => s.tier);
  const [search, setSearch] = useState('');

  useEffect(() => {
    load();
  }, [load]);

  const atFreeLimit = tier === 'free' && pieces.length >= FREE_PIECE_LIMIT;

  const filtered = useMemo(() => {
    if (!search.trim()) return pieces;
    const q = search.toLowerCase();
    return pieces.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        (p.style && p.style.toLowerCase().includes(q)) ||
        (p.song_title && p.song_title.toLowerCase().includes(q)),
    );
  }, [pieces, search]);

  return (
    <PageContainer
      title="Pieces"
      actions={
        <div className="flex flex-col items-end gap-1">
          <Link to={atFreeLimit ? '#' : '/pieces/new'}>
            <Button disabled={atFreeLimit}>
              <Plus size={16} />
              New Piece
            </Button>
          </Link>
          {atFreeLimit && (
            <p className="text-xs text-text-tertiary text-right max-w-[200px]">
              Free tier allows up to {FREE_PIECE_LIMIT} pieces. Upgrade to create more.
            </p>
          )}
        </div>
      }
    >
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : pieces.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No pieces yet"
          description="Create your first piece to start building formations and mapping choreography."
          action={
            <Link to="/pieces/new">
              <Button>
                <Plus size={16} />
                Create Your First Piece
              </Button>
            </Link>
          }
        />
      ) : (
        <>
          {pieces.length > 3 && (
            <div className="mb-6">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search pieces by title, style, or song..."
                className="max-w-md"
              />
            </div>
          )}
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            {filtered.map((piece) => (
              <motion.div key={piece.id} variants={staggerItem}>
                <PieceCard piece={piece} />
              </motion.div>
            ))}
          </motion.div>
          {search && filtered.length === 0 && (
            <p className="text-center text-sm text-text-tertiary py-12">
              No pieces match "{search}"
            </p>
          )}
        </>
      )}
    </PageContainer>
  );
}
