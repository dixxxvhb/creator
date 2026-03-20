import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import type { Piece, PieceUpdate } from '@/types';
import { DANCE_STYLES } from '@/types';

interface PieceInfoModalProps {
  open: boolean;
  onClose: () => void;
  piece: Piece;
  onSave: (updates: PieceUpdate) => Promise<void>;
}

export function PieceInfoModal({ open, onClose, piece, onSave }: PieceInfoModalProps) {
  const [title, setTitle] = useState(piece.title);
  const [style, setStyle] = useState(piece.style ?? '');
  const [songTitle, setSongTitle] = useState(piece.song_title ?? '');
  const [songArtist, setSongArtist] = useState(piece.song_artist ?? '');
  const [bpm, setBpm] = useState(piece.bpm?.toString() ?? '');
  const [durationSeconds, setDurationSeconds] = useState(piece.duration_seconds?.toString() ?? '');
  const [stageWidth, setStageWidth] = useState(piece.stage_width.toString());
  const [stageDepth, setStageDepth] = useState(piece.stage_depth.toString());
  const [notes, setNotes] = useState(piece.notes ?? '');
  const [isSaving, setIsSaving] = useState(false);

  // Reset form when piece changes or modal opens
  useEffect(() => {
    if (open) {
      setTitle(piece.title);
      setStyle(piece.style ?? '');
      setSongTitle(piece.song_title ?? '');
      setSongArtist(piece.song_artist ?? '');
      setBpm(piece.bpm?.toString() ?? '');
      setDurationSeconds(piece.duration_seconds?.toString() ?? '');
      setStageWidth(piece.stage_width.toString());
      setStageDepth(piece.stage_depth.toString());
      setNotes(piece.notes ?? '');
    }
  }, [open, piece]);

  async function handleSave() {
    setIsSaving(true);
    try {
      await onSave({
        title: title.trim() || 'Untitled Piece',
        style: style || null,
        song_title: songTitle.trim() || null,
        song_artist: songArtist.trim() || null,
        bpm: bpm ? parseInt(bpm) || null : null,
        duration_seconds: durationSeconds ? parseInt(durationSeconds) || null : null,
        stage_width: parseInt(stageWidth) || 40,
        stage_depth: parseInt(stageDepth) || 30,
        notes: notes.trim(),
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  }

  const styleOptions = [
    { value: '', label: 'Select style...' },
    ...DANCE_STYLES.map((s) => ({ value: s, label: s })),
  ];

  return (
    <Modal open={open} onClose={onClose} title="Piece Details">
      <div className="space-y-5">
        {/* Title */}
        <Input
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Piece name"
        />

        {/* Style */}
        <Select
          label="Style"
          value={style}
          onChange={(e) => setStyle(e.target.value)}
          options={styleOptions}
        />

        {/* Song info */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Song Title"
            value={songTitle}
            onChange={(e) => setSongTitle(e.target.value)}
            placeholder="Song name"
          />
          <Input
            label="Song Artist"
            value={songArtist}
            onChange={(e) => setSongArtist(e.target.value)}
            placeholder="Artist name"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="BPM"
            type="number"
            value={bpm}
            onChange={(e) => setBpm(e.target.value)}
            placeholder="120"
          />
          <Input
            label="Duration (seconds)"
            type="number"
            value={durationSeconds}
            onChange={(e) => setDurationSeconds(e.target.value)}
            placeholder="180"
          />
        </div>

        {/* Stage dimensions */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Stage Width"
            type="number"
            value={stageWidth}
            onChange={(e) => setStageWidth(e.target.value)}
            placeholder="40"
          />
          <Input
            label="Stage Depth"
            type="number"
            value={stageDepth}
            onChange={(e) => setStageDepth(e.target.value)}
            placeholder="30"
          />
        </div>

        {/* Notes */}
        <Textarea
          label="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="General notes about this piece..."
          rows={3}
        />

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} loading={isSaving}>
            Save
          </Button>
        </div>
      </div>
    </Modal>
  );
}
