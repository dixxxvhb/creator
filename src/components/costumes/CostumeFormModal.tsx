import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import type { Costume, CostumeInsert, Piece } from '@/types';

interface CostumeFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CostumeInsert) => Promise<void>;
  pieces: Piece[];
  costume?: Costume | null;
  defaultPieceId?: string;
}

export function CostumeFormModal({ open, onClose, onSubmit, pieces, costume, defaultPieceId }: CostumeFormModalProps) {
  const [pieceId, setPieceId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('');
  const [cost, setCost] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setPieceId(costume?.piece_id ?? defaultPieceId ?? '');
      setName(costume?.name ?? '');
      setDescription(costume?.description ?? '');
      setColor(costume?.color ?? '');
      setCost(costume?.cost?.toString() ?? '');
      setNotes(costume?.notes ?? '');
    }
  }, [open, costume, defaultPieceId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !pieceId) return;
    setIsSubmitting(true);
    await onSubmit({
      piece_id: pieceId,
      name: name.trim(),
      description: description.trim(),
      color,
      image_url: costume?.image_url ?? null,
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
    <Modal open={open} onClose={onClose} title={costume ? 'Edit Costume' : 'Add Costume'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select label="Piece" options={pieceOptions} value={pieceId} onChange={(e) => setPieceId(e.target.value)} />
        <Input
          label="Costume Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Blue sequin dress"
          required
          autoFocus
        />
        <Input
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Floor-length, halter neck"
        />
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-secondary">Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={color || '#3B82F6'}
                onChange={(e) => setColor(e.target.value)}
                className="w-8 h-8 rounded-lg border border-border cursor-pointer"
              />
              <Input
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="#hex"
                className="flex-1"
              />
            </div>
          </div>
          <Input
            label="Cost ($)"
            type="number"
            step="0.01"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            placeholder="0.00"
          />
        </div>
        <Textarea
          label="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Care instructions, vendor info..."
          rows={2}
        />
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={isSubmitting} disabled={!name.trim() || !pieceId}>
            {costume ? 'Save Changes' : 'Add Costume'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
