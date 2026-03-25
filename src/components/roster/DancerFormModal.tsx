import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
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
  const [notes, setNotes] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [shoeSize, setShoeSize] = useState('');
  const [tightsSize, setTightsSize] = useState('');
  const [height, setHeight] = useState('');
  const [showContact, setShowContact] = useState(false);
  const [showMeasurements, setShowMeasurements] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setFullName(dancer?.full_name ?? '');
      setShortName(dancer?.short_name ?? '');
      setBirthday(dancer?.birthday ?? '');
      setColor(dancer?.color ?? defaultColor ?? DANCER_COLORS[0]);
      setNotes(dancer?.notes ?? '');
      setParentName(dancer?.parent_name ?? '');
      setParentEmail(dancer?.parent_email ?? '');
      setParentPhone(dancer?.parent_phone ?? '');
      setShoeSize(dancer?.shoe_size ?? '');
      setTightsSize(dancer?.tights_size ?? '');
      setHeight(dancer?.height ?? '');
      setShowContact(!!(dancer?.parent_name || dancer?.parent_email || dancer?.parent_phone));
      setShowMeasurements(!!(dancer?.shoe_size || dancer?.tights_size || dancer?.height));
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
      notes: notes.trim() || null,
      parent_name: parentName.trim() || null,
      parent_email: parentEmail.trim() || null,
      parent_phone: parentPhone.trim() || null,
      shoe_size: shoeSize.trim() || null,
      tights_size: tightsSize.trim() || null,
      height: height.trim() || null,
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

        {/* Notes */}
        <Textarea
          label="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Allergies, injuries, special considerations..."
          rows={2}
        />

        {/* Parent Contact (collapsible) */}
        <div>
          <button
            type="button"
            onClick={() => setShowContact(!showContact)}
            className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
          >
            Parent Contact {showContact ? '\u25BE' : '\u25B8'}
          </button>
          {showContact && (
            <div className="space-y-3 mt-2">
              <Input
                label="Parent Name"
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                placeholder="e.g., Sarah Johnson"
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Email"
                  type="email"
                  value={parentEmail}
                  onChange={(e) => setParentEmail(e.target.value)}
                  placeholder="parent@email.com"
                />
                <Input
                  label="Phone"
                  type="tel"
                  value={parentPhone}
                  onChange={(e) => setParentPhone(e.target.value)}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
          )}
        </div>

        {/* Measurements (collapsible) */}
        <div>
          <button
            type="button"
            onClick={() => setShowMeasurements(!showMeasurements)}
            className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
          >
            Measurements {showMeasurements ? '\u25BE' : '\u25B8'}
          </button>
          {showMeasurements && (
            <div className="grid grid-cols-3 gap-3 mt-2">
              <Input
                label="Shoe Size"
                value={shoeSize}
                onChange={(e) => setShoeSize(e.target.value)}
                placeholder="e.g., 7.5"
              />
              <Input
                label="Tights Size"
                value={tightsSize}
                onChange={(e) => setTightsSize(e.target.value)}
                placeholder="e.g., S/M"
              />
              <Input
                label="Height"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder={'e.g., 5\'4"'}
              />
            </div>
          )}
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
