import { ArrowLeft, Save, Music, Users, Pencil, Download, Trash2, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SaveStatusIndicator } from '@/components/canvas/SaveStatusIndicator';
import type { SaveStatus } from '@/components/canvas/SaveStatusIndicator';
import type { Piece } from '@/types';

interface PieceDetailHeaderProps {
  piece: Piece;
  avgAge: number | null;
  saveStatus: SaveStatus;
  isSaving: boolean;
  saveDisabled: boolean;
  onBack: () => void;
  onOpenInfo: () => void;
  onOpenDancerManage: () => void;
  onOpenShare: () => void;
  onOpenExport: () => void;
  onSave: () => void;
  onDelete: () => void;
}

export function PieceDetailHeader({
  piece,
  avgAge,
  saveStatus,
  isSaving,
  saveDisabled,
  onBack,
  onOpenInfo,
  onOpenDancerManage,
  onOpenShare,
  onOpenExport,
  onSave,
  onDelete,
}: PieceDetailHeaderProps) {
  const songText =
    piece.song_title || piece.song_artist
      ? [piece.song_title, piece.song_artist].filter(Boolean).join(' · ')
      : null;

  return (
    <>
      {/* Top bar */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors shrink-0"
            aria-label="Back to pieces"
          >
            <ArrowLeft size={18} />
          </button>

          <button
            onClick={onOpenInfo}
            className="flex items-center gap-2 group text-left min-w-0"
          >
            <h2 className="text-lg font-bold text-text-primary truncate">
              {piece.title}
            </h2>
            <Pencil
              size={14}
              className="text-text-tertiary group-hover:text-text-secondary transition-colors shrink-0"
            />
          </button>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <SaveStatusIndicator status={saveStatus} />
          <Button variant="secondary" size="sm" onClick={onOpenShare}>
            <Share2 size={14} />
            <span className="hidden sm:inline">Share</span>
          </Button>
          <Button variant="secondary" size="sm" onClick={onOpenExport}>
            <Download size={14} />
            <span className="hidden sm:inline">Export</span>
          </Button>
          <Button size="sm" onClick={onSave} loading={isSaving} disabled={saveDisabled}>
            <Save size={14} />
            <span className="hidden sm:inline">Save</span>
          </Button>
          <Button variant="danger" size="sm" onClick={onDelete}>
            <Trash2 size={14} />
          </Button>
        </div>
      </div>

      {/* Metadata badges */}
      <div className="flex items-center gap-1.5 flex-wrap mb-3 ml-9">
        {piece.style && (
          <button onClick={onOpenInfo} className="cursor-pointer hover:brightness-90 transition-all">
            <Badge>{piece.style}</Badge>
          </button>
        )}
        <button onClick={onOpenDancerManage} className="cursor-pointer hover:brightness-90 transition-all">
          <Badge variant="info">
            <Users size={12} className="mr-1" />
            {piece.dancer_count} dancer{piece.dancer_count !== 1 ? 's' : ''}
          </Badge>
        </button>
        {songText && (
          <Badge variant="default">
            <Music size={12} className="mr-1" />
            {songText}
          </Badge>
        )}
        {avgAge !== null && (
          <Badge variant="default">
            Average age {avgAge.toFixed(1)}
          </Badge>
        )}
      </div>
    </>
  );
}
