import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import type { Show, ShowInsert } from '@/types';

interface ShowFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ShowInsert) => Promise<void>;
  seasons: { id: string; name: string }[];
  show?: Show | null;
}

export function ShowFormModal({ open, onClose, onSubmit, seasons, show }: ShowFormModalProps) {
  const [name, setName] = useState('');
  const [seasonId, setSeasonId] = useState('');
  const [date, setDate] = useState('');
  const [venue, setVenue] = useState('');
  const [notes, setNotes] = useState('');
  const [bufferActs, setBufferActs] = useState(2);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setName(show?.name ?? '');
      setSeasonId(show?.season_id ?? seasons[0]?.id ?? '');
      setDate(show?.date ?? '');
      setVenue(show?.venue ?? '');
      setNotes(show?.notes ?? '');
      setBufferActs(show?.buffer_acts ?? 2);
    }
  }, [open, show, seasons]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !seasonId) return;
    setIsSubmitting(true);
    await onSubmit({
      season_id: seasonId,
      name: name.trim(),
      date: date || null,
      venue: venue.trim(),
      notes,
      buffer_acts: bufferActs,
    });
    setIsSubmitting(false);
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={show ? 'Edit Show' : 'Add Show'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Show Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Spring Recital 2026" required />

        {!show && seasons.length > 1 && (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-secondary">Season</label>
            <select value={seasonId} onChange={(e) => setSeasonId(e.target.value)} className="w-full rounded-lg border border-border bg-surface-secondary px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] transition-colors" required>
              {seasons.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <Input label="Venue" value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="e.g. ME Theatre" />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-secondary">
            Min acts between same dancer: {bufferActs}
          </label>
          <input type="range" min={1} max={5} step={1} value={bufferActs} onChange={(e) => setBufferActs(parseInt(e.target.value))} className="w-full" style={{ accentColor: 'var(--color-accent)' }} />
          <div className="flex justify-between text-[10px] text-text-tertiary">
            <span>1</span><span>5</span>
          </div>
        </div>

        <Textarea label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Show details..." rows={3} />

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={isSubmitting} disabled={!name.trim()}>
            {show ? 'Save Changes' : 'Add Show'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
