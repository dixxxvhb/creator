import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Music, Users } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cardHover } from '@/lib/motion';
import type { Piece } from '@/types';

interface PieceCardProps {
  piece: Piece;
}

export function PieceCard({ piece }: PieceCardProps) {
  const songText =
    piece.song_title || piece.song_artist
      ? [piece.song_title, piece.song_artist].filter(Boolean).join(' — ')
      : 'No song';

  return (
    <motion.div {...cardHover}>
      <Link to={`/pieces/${piece.id}`} className="block">
        <Card className="cursor-pointer hover:border-border transition-colors">
          <div className="space-y-3">
            <h3 className="text-base font-semibold text-text-primary truncate">
              {piece.title}
            </h3>

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
    </motion.div>
  );
}
