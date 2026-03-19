import { useNavigate } from 'react-router-dom';
import { Music, Users } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { Piece } from '@/types';

interface PieceCardProps {
  piece: Piece;
}

export function PieceCard({ piece }: PieceCardProps) {
  const navigate = useNavigate();

  const songText =
    piece.song_title || piece.song_artist
      ? [piece.song_title, piece.song_artist].filter(Boolean).join(' — ')
      : 'No song';

  return (
    <Card
      className="cursor-pointer hover:border-slate-600 transition-colors"
    >
      <div onClick={() => navigate(`/pieces/${piece.id}`)} className="space-y-3">
        <h3 className="text-base font-semibold text-slate-100 truncate">
          {piece.title}
        </h3>

        {piece.style && (
          <Badge>{piece.style}</Badge>
        )}

        <div className="flex items-center gap-1.5 text-sm text-slate-400">
          <Music size={14} className="shrink-0" />
          <span className="truncate">{songText}</span>
        </div>

        <div className="flex items-center gap-1.5 text-sm text-slate-400">
          <Users size={14} className="shrink-0" />
          <span>
            {piece.dancer_count} dancer{piece.dancer_count !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
    </Card>
  );
}
