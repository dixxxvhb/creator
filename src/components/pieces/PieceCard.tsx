import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Music, Users, Copy, MoreVertical, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cardHover } from '@/lib/motion';
import { usePieceStore } from '@/stores/pieceStore';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import type { Piece } from '@/types';

interface PieceCardProps {
  piece: Piece;
}

export function PieceCard({ piece }: PieceCardProps) {
  const duplicate = usePieceStore((s) => s.duplicate);
  const remove = usePieceStore((s) => s.remove);
  const [showMenu, setShowMenu] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);

  const songText =
    piece.song_title || piece.song_artist
      ? [piece.song_title, piece.song_artist].filter(Boolean).join(' — ')
      : 'No song';

  async function handleDuplicate(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setShowMenu(false);
    setIsDuplicating(true);
    await duplicate(piece.id);
    setIsDuplicating(false);
  }

  function handleDeleteClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setShowMenu(false);
    setShowDelete(true);
  }

  return (
    <motion.div {...cardHover} className="relative group">
      <Link to={`/pieces/${piece.id}`} className="block">
        <Card interactive className={isDuplicating ? 'opacity-60' : ''}>
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <h3 className="font-display text-base font-semibold text-text-primary truncate flex-1 pr-2">
                {piece.title}
              </h3>
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowMenu(!showMenu); }}
                className="p-1 rounded-lg text-text-tertiary hover:text-text-secondary hover:bg-surface-secondary transition-colors opacity-0 group-hover:opacity-100 -mr-1 -mt-1"
              >
                <MoreVertical size={16} />
              </button>
            </div>

            {piece.style && (
              <Badge>{piece.style}</Badge>
            )}

            <div className="flex items-center gap-1.5 text-sm text-text-secondary">
              <Music size={14} className="shrink-0" />
              <span className="truncate">{songText}</span>
            </div>

            <div className="flex items-center gap-1.5 text-sm text-text-secondary">
              <Users size={14} className="shrink-0" />
              <span>
                {piece.dancer_count} dancer{piece.dancer_count !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </Card>
      </Link>

      {/* Context menu */}
      {showMenu && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setShowMenu(false)} />
          <div className="absolute right-2 top-12 z-30 bg-surface-elevated border border-border-light rounded-xl shadow-lg py-1 min-w-[140px]">
            <button
              onClick={handleDuplicate}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-text-primary hover:bg-surface-secondary transition-colors"
            >
              <Copy size={14} />
              Duplicate
            </button>
            <button
              onClick={handleDeleteClick}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-danger-500 hover:bg-danger-50 transition-colors"
            >
              <Trash2 size={14} />
              Delete
            </button>
          </div>
        </>
      )}

      <ConfirmDialog
        open={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={async () => {
          await remove(piece.id);
          setShowDelete(false);
        }}
        title="Delete Piece"
        description={`Delete "${piece.title}"? All formations, positions, and paths will be permanently removed.`}
        confirmLabel="Delete Piece"
      />
    </motion.div>
  );
}
