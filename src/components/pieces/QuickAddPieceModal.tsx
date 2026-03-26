import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { usePieceStore } from '@/stores/pieceStore';
import { useFormationStore } from '@/stores/formationStore';
import { useProfileStore } from '@/stores/profileStore';
import type { Piece, PieceInsert } from '@/types';
import { DANCE_STYLES } from '@/types';

interface QuickAddPieceModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (piece: Piece) => void;
}

const styleOptions = [
  { value: '', label: 'Select style...' },
  ...DANCE_STYLES.map((s) => ({ value: s, label: s })),
];

export function QuickAddPieceModal({ open, onClose, onCreated }: QuickAddPieceModalProps) {
  const [title, setTitle] = useState('');
  const [songTitle, setSongTitle] = useState('');
  const [songArtist, setSongArtist] = useState('');
  const [style, setStyle] = useState('');
  const [dancerCount, setDancerCount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addPiece = usePieceStore((s) => s.add);
  const addFormation = useFormationStore((s) => s.addFormation);
  const defaultStageWidth = useProfileStore((s) => s.defaultStageWidth);
  const defaultStageDepth = useProfileStore((s) => s.defaultStageDepth);

  useEffect(() => {
    if (open) {
      setTitle('');
      setSongTitle('');
      setSongArtist('');
      setStyle('');
      setDancerCount('');
      setIsSubmitting(false);
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      const data: PieceInsert = {
        title: title.trim(),
        song_title: songTitle.trim() || null,
        song_artist: songArtist.trim() || null,
        style: style || null,
        group_size: null,
        dancer_count: dancerCount ? parseInt(dancerCount) : 0,
        bpm: null,
        duration_seconds: null,
        audio_url: null,
        stage_width: defaultStageWidth,
        stage_depth: defaultStageDepth,
        choreographer: null,
        notes: '',
        sort_order: 0,
        focal_dancer_id: null,
      };

      const piece = await addPiece(data);
      if (!piece) {
        setIsSubmitting(false);
        return;
      }

      // Create Formation 1 so piece is valid if opened in canvas later
      await addFormation({
        piece_id: piece.id,
        index: 0,
        label: 'Formation 1',
        timestamp_seconds: null,
        choreo_notes: '',
        counts_notes: '',
        transition_duration_ms: 2000,
        transition_easing: 'ease-in-out',
      });

      onCreated(piece);
      onClose();
    } catch {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="New Piece" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Opening Number"
          required
          autoFocus
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Song Title"
            value={songTitle}
            onChange={(e) => setSongTitle(e.target.value)}
            placeholder="e.g., River"
          />
          <Input
            label="Song Artist"
            value={songArtist}
            onChange={(e) => setSongArtist(e.target.value)}
            placeholder="e.g., Leon Bridges"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Style"
            options={styleOptions}
            value={style}
            onChange={(e) => setStyle(e.target.value)}
          />
          <Input
            label="Dancer Count"
            type="number"
            min={0}
            value={dancerCount}
            onChange={(e) => setDancerCount(e.target.value)}
            placeholder="0"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting} disabled={!title.trim()}>
            Create Piece
          </Button>
        </div>
      </form>
    </Modal>
  );
}
