import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import type { CompetitionEntry, CompetitionEntryInsert, Piece } from '@/types';

interface EntryFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CompetitionEntryInsert) => Promise<void>;
  competitionId: string;
  pieces: Piece[];
  entry?: CompetitionEntry | null;
}

const PLACEMENT_OPTIONS = [
  { value: '', label: 'No placement yet' },
  { value: '1st Overall', label: '1st Overall' },
  { value: '2nd Overall', label: '2nd Overall' },
  { value: '3rd Overall', label: '3rd Overall' },
  { value: 'Platinum', label: 'Platinum' },
  { value: 'High Gold', label: 'High Gold' },
  { value: 'Gold', label: 'Gold' },
  { value: 'High Silver', label: 'High Silver' },
  { value: 'Silver', label: 'Silver' },
];

export function EntryFormModal({ open, onClose, onSubmit, competitionId, pieces, entry }: EntryFormModalProps) {
  const [pieceId, setPieceId] = useState('');
  const [category, setCategory] = useState('');
  const [placement, setPlacement] = useState('');
  const [score, setScore] = useState('');
  const [specialAwards, setSpecialAwards] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setPieceId(entry?.piece_id ?? '');
      setCategory(entry?.category ?? '');
      setPlacement(entry?.placement ?? '');
      setScore(entry?.score?.toString() ?? '');
      setSpecialAwards(entry?.special_awards ?? '');
      setNotes(entry?.notes ?? '');
    }
  }, [open, entry]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pieceId) return;
    setIsSubmitting(true);
    await onSubmit({
      competition_id: competitionId,
      piece_id: pieceId,
      category: category.trim(),
      placement: placement || null,
      score: score ? parseFloat(score) : null,
      special_awards: specialAwards.trim() || null,
      notes,
    });
    setIsSubmitting(false);
    onClose();
  }

  const pieceOptions = pieces.map((p) => ({ value: p.id, label: p.title }));

  return (
    <Modal open={open} onClose={onClose} title={entry ? 'Edit Entry' : 'Add Entry'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Piece"
          options={[{ value: '', label: 'Select a piece...' }, ...pieceOptions]}
          value={pieceId}
          onChange={(e) => setPieceId(e.target.value)}
        />
        <Input
          label="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="e.g. Teen Contemporary Small Group"
        />
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Placement"
            options={PLACEMENT_OPTIONS}
            value={placement}
            onChange={(e) => setPlacement(e.target.value)}
          />
          <Input
            label="Score"
            type="number"
            step="0.01"
            value={score}
            onChange={(e) => setScore(e.target.value)}
            placeholder="e.g. 285.50"
          />
        </div>
        <Input
          label="Special Awards"
          value={specialAwards}
          onChange={(e) => setSpecialAwards(e.target.value)}
          placeholder="e.g. Best Choreography, Judges' Choice"
        />
        <Textarea
          label="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Judge feedback, performance notes..."
          rows={3}
        />
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting} disabled={!pieceId}>
            {entry ? 'Save Changes' : 'Add Entry'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
