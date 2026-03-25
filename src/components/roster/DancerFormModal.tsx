import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { DANCER_COLORS } from '@/types';
import { cn } from '@/lib/utils';
import type { Dancer, DancerInsert } from '@/types';

interface DancerFormModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: DancerInsert) => Promise<void>;
  dancer?: Dancer | null;
  defaultColor?: string;
}

export function DancerFormModal({ open, onClose, onSave, dancer, defaultColor }: DancerFormModalProps) {
  const [fullName, setFullName] = useState('');
  const [shortName, setShortName] = useState('');
  const [birthday, setBirthday] = useState('');
  const [color, setColor] = useState(defaultColor ?? DANCER_COLORS[0]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setFullName(dancer?.full_name ?? '');
      setShortName(dancer?.short_name ?? '');
      setBirthday(dancer?.birthday ?? '');
      setColor(dancer?.color ?? defaultColor ?? DANCER_COLORS[0]);
      setIsSaving(false);
    }
  }, [open, dancer, defaultColor]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim() || !shortName.trim()) return;
    setIsSaving(true);
    await onSave({
      full_name: fullName.trim(),
      short_name: shortName.trim(),
      birthday: birthday || null,
      color,
      is_active: dancer?.is_active ?? true,
    });
    setIsSaving(false);
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={dancer ? 'Edit Dancer' : 'Add Dancer'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Full Name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="e.g., Aaliyah Johnson"
          required
          autoFocus
        />
        <Input
          label="Short Name"
          value={shortName}
          onChange={(e) => setShortName(e.target.value)}
          placeholder="e.g., Aaliyah"
          required
        />
        <Input
          label="Birthday"
          type="date"
          value={birthday}
          onChange={(e) => setBirthday(e.target.value)}
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-secondary">Color</label>
          <div className="flex flex-wrap gap-2">
            {DANCER_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={cn(
                  'w-7 h-7 rounded-full transition-all',
                  color === c
                    ? 'ring-2 ring-white ring-offset-2 ring-offset-surface-elevated scale-110'
                    : 'hover:scale-110'
                )}
                style={{ backgroundColor: c }}
                aria-label={`Color ${c}`}
              />
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isSaving}>
            {dancer ? 'Save' : 'Add Dancer'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
