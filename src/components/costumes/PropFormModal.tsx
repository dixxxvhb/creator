import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import type { Prop, PropInsert, Piece } from '@/types';

interface PropFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: PropInsert) => Promise<void>;
  pieces: Piece[];
  prop?: Prop | null;
  defaultPieceId?: string;
}

export function PropFormModal({ open, onClose, onSubmit, pieces, prop, defaultPieceId }: PropFormModalProps) {
  const [pieceId, setPieceId] = useState('');
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [cost, setCost] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setPieceId(prop?.piece_id ?? defaultPieceId ?? '');
      setName(prop?.name ?? '');
      setQuantity(prop?.quantity ?? 1);
      setCost(prop?.cost?.toString() ?? '');
      setNotes(prop?.notes ?? '');
    }
  }, [open, prop, defaultPieceId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !pieceId) return;
    if (cost && parseFloat(cost) < 0) return;
    setIsSubmitting(true);
    await onSubmit({
      piece_id: pieceId,
      name: name.trim(),
      quantity,
      cost: cost ? parseFloat(cost) : null,
      notes,
    });
    setIsSubmitting(false);
    onClose();
  }

  const pieceOptions = [
    { value: '', label: 'Select a piece...' },
    ...pieces.map((p) => ({ value: p.id, label: p.title })),
  ];

  return (
    <Modal open={open} onClose={onClose} title={prop ? 'Edit Prop' : 'Add Prop'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select label="Piece" options={pieceOptions} value={pieceId} onChange={(e) => setPieceId(e.target.value)} />
        <Input
          label="Prop Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Folding chairs"
          required
          autoFocus
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Quantity"
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
          />
          <Input
            label="Cost ($)"
            type="number"
            step="0.01"
            min="0"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            placeholder="0.00"
          />
        </div>
        <Textarea
          label="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Where to source, storage notes..."
          rows={2}
        />
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={isSubmitting} disabled={!name.trim() || !pieceId}>
            {prop ? 'Save Changes' : 'Add Prop'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
