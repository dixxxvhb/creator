import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import type { Competition, CompetitionInsert } from '@/types';

interface CompetitionFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CompetitionInsert) => Promise<void>;
  seasonId: string;
  competition?: Competition | null;
}

export function CompetitionFormModal({ open, onClose, onSubmit, seasonId, competition }: CompetitionFormModalProps) {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setName(competition?.name ?? '');
      setLocation(competition?.location ?? '');
      setDate(competition?.date ?? '');
      setNotes(competition?.notes ?? '');
    }
  }, [open, competition]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);
    await onSubmit({
      season_id: seasonId,
      name: name.trim(),
      location: location.trim(),
      date: date || null,
      notes,
    });
    setIsSubmitting(false);
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={competition ? 'Edit Competition' : 'Add Competition'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Competition Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Showstopper Dance Competition"
          required
          autoFocus
        />
        <Input
          label="Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="e.g. Orlando Convention Center"
        />
        <Input
          label="Date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <Textarea
          label="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Competition details, schedule info..."
          rows={3}
        />
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting} disabled={!name.trim()}>
            {competition ? 'Save Changes' : 'Add Competition'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
