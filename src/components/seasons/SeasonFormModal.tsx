import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import type { Season, SeasonInsert } from '@/types';

interface SeasonFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: SeasonInsert) => Promise<void>;
  season?: Season | null;
}

export function SeasonFormModal({ open, onClose, onSubmit, season }: SeasonFormModalProps) {
  const [name, setName] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setName(season?.name ?? '');
      setYear(season?.year ?? new Date().getFullYear());
      setStartDate(season?.start_date ?? '');
      setEndDate(season?.end_date ?? '');
      setNotes(season?.notes ?? '');
    }
  }, [open, season]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);
    await onSubmit({
      name: name.trim(),
      year,
      start_date: startDate || null,
      end_date: endDate || null,
      notes,
      sort_order: 0,
    });
    setIsSubmitting(false);
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={season ? 'Edit Season' : 'New Season'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Season Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Spring 2026"
          required
          autoFocus
        />
        <Input
          label="Year"
          type="number"
          value={year}
          onChange={(e) => setYear(parseInt(e.target.value) || new Date().getFullYear())}
          min={2020}
          max={2099}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <Input
            label="End Date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <Textarea
          label="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Season goals, themes, or reminders..."
          rows={3}
        />
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting} disabled={!name.trim()}>
            {season ? 'Save Changes' : 'Create Season'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
