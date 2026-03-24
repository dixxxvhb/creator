import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
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
  // Core fields
  const [fullName, setFullName] = useState('');
  const [shortName, setShortName] = useState('');
  const [birthday, setBirthday] = useState('');
  const [color, setColor] = useState(defaultColor ?? DANCER_COLORS[0]);

  // Measurements
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [bust, setBust] = useState('');
  const [waist, setWaist] = useState('');
  const [hips, setHips] = useState('');
  const [inseam, setInseam] = useState('');
  const [shoeSize, setShoeSize] = useState('');
  const [tightsSize, setTightsSize] = useState('');
  const [headpieceSize, setHeadpieceSize] = useState('');

  // Contact
  const [parentName, setParentName] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [parentPhone, setParentPhone] = useState('');

  // Notes
  const [notes, setNotes] = useState('');

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [measurementsOpen, setMeasurementsOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setFullName(dancer?.full_name ?? '');
      setShortName(dancer?.short_name ?? '');
      setBirthday(dancer?.birthday ?? '');
      setColor(dancer?.color ?? defaultColor ?? DANCER_COLORS[0]);
      setHeight(dancer?.height ?? '');
      setWeight(dancer?.weight ?? '');
      setBust(dancer?.bust ?? '');
      setWaist(dancer?.waist ?? '');
      setHips(dancer?.hips ?? '');
      setInseam(dancer?.inseam ?? '');
      setShoeSize(dancer?.shoe_size ?? '');
      setTightsSize(dancer?.tights_size ?? '');
      setHeadpieceSize(dancer?.headpiece_size ?? '');
      setParentName(dancer?.parent_name ?? '');
      setParentEmail(dancer?.parent_email ?? '');
      setParentPhone(dancer?.parent_phone ?? '');
      setNotes(dancer?.notes ?? '');
      setIsSaving(false);
      setContactOpen(false);
      setMeasurementsOpen(false);
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
      height: height.trim() || null,
      weight: weight.trim() || null,
      bust: bust.trim() || null,
      waist: waist.trim() || null,
      hips: hips.trim() || null,
      inseam: inseam.trim() || null,
      shoe_size: shoeSize.trim() || null,
      tights_size: tightsSize.trim() || null,
      headpiece_size: headpieceSize.trim() || null,
      parent_name: parentName.trim() || null,
      parent_email: parentEmail.trim() || null,
      parent_phone: parentPhone.trim() || null,
      notes: notes,
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

        {/* Parent/Guardian section */}
        <div className="border border-border rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setContactOpen((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-secondary/40 transition-colors"
          >
            <span>Parent / Guardian</span>
            {contactOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {contactOpen && (
            <div className="px-4 pb-4 pt-1 space-y-3 border-t border-border">
              <Input
                label="Parent Name"
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                placeholder="e.g., Lisa Johnson"
              />
              <Input
                label="Parent Email"
                type="email"
                value={parentEmail}
                onChange={(e) => setParentEmail(e.target.value)}
                placeholder="e.g., lisa@email.com"
              />
              <Input
                label="Parent Phone"
                type="tel"
                value={parentPhone}
                onChange={(e) => setParentPhone(e.target.value)}
                placeholder="e.g., (407) 555-1234"
              />
            </div>
          )}
        </div>

        {/* Measurements section */}
        <div className="border border-border rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setMeasurementsOpen((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-secondary/40 transition-colors"
          >
            <span>Measurements</span>
            {measurementsOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {measurementsOpen && (
            <div className="px-4 pb-4 pt-1 space-y-3 border-t border-border">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Height"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder={`e.g., 5'4"`}
                />
                <Input
                  label="Weight"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="e.g., 110 lbs"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Bust"
                  value={bust}
                  onChange={(e) => setBust(e.target.value)}
                  placeholder='e.g., 32"'
                />
                <Input
                  label="Waist"
                  value={waist}
                  onChange={(e) => setWaist(e.target.value)}
                  placeholder='e.g., 26"'
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Hips"
                  value={hips}
                  onChange={(e) => setHips(e.target.value)}
                  placeholder='e.g., 34"'
                />
                <Input
                  label="Inseam"
                  value={inseam}
                  onChange={(e) => setInseam(e.target.value)}
                  placeholder='e.g., 28"'
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Input
                  label="Shoe Size"
                  value={shoeSize}
                  onChange={(e) => setShoeSize(e.target.value)}
                  placeholder="e.g., 7"
                />
                <Input
                  label="Tights Size"
                  value={tightsSize}
                  onChange={(e) => setTightsSize(e.target.value)}
                  placeholder="e.g., SM"
                />
                <Input
                  label="Headpiece"
                  value={headpieceSize}
                  onChange={(e) => setHeadpieceSize(e.target.value)}
                  placeholder='e.g., 21"'
                />
              </div>
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-secondary">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any additional notes about this dancer..."
            rows={3}
            className="w-full rounded-xl border border-border bg-surface-secondary px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] resize-none"
          />
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
