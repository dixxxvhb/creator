import { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import type {
  Costume, CostumeInsert, Piece,
  CostumeAccessory, CostumeAccessoryInsert, AccessoryType,
} from '@/types';
import { COSTUME_ORDER_STATUSES, ACCESSORY_TYPES } from '@/types';

interface CostumeFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CostumeInsert) => Promise<void>;
  pieces: Piece[];
  costume?: Costume | null;
  defaultPieceId?: string;
  accessories?: CostumeAccessory[];
  onAddAccessory?: (data: CostumeAccessoryInsert) => Promise<void>;
  onRemoveAccessory?: (id: string) => Promise<void>;
}

const ORDER_STATUS_LABELS: Record<string, string> = {
  not_ordered: 'Not Ordered',
  ordered: 'Ordered',
  arrived: 'Arrived',
  needs_alteration: 'Needs Alteration',
  ready: 'Ready',
};

export function CostumeFormModal({
  open,
  onClose,
  onSubmit,
  pieces,
  costume,
  defaultPieceId,
  accessories = [],
  onAddAccessory,
  onRemoveAccessory,
}: CostumeFormModalProps) {
  const [pieceId, setPieceId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('');
  const [cost, setCost] = useState('');
  const [notes, setNotes] = useState('');
  const [vendorUrl, setVendorUrl] = useState('');
  const [orderStatus, setOrderStatus] = useState('not_ordered');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Accessory form state
  const [accType, setAccType] = useState<AccessoryType>('hairpiece');
  const [accDescription, setAccDescription] = useState('');
  const [accColor, setAccColor] = useState('');
  const [accLink, setAccLink] = useState('');
  const [addingAcc, setAddingAcc] = useState(false);
  const [showAccForm, setShowAccForm] = useState(false);

  useEffect(() => {
    if (open) {
      setPieceId(costume?.piece_id ?? defaultPieceId ?? '');
      setName(costume?.name ?? '');
      setDescription(costume?.description ?? '');
      setColor(costume?.color ?? '');
      setCost(costume?.cost?.toString() ?? '');
      setNotes(costume?.notes ?? '');
      setVendorUrl(costume?.vendor_url ?? '');
      setOrderStatus(costume?.order_status ?? 'not_ordered');
      setShowAccForm(false);
      setAccType('hairpiece');
      setAccDescription('');
      setAccColor('');
      setAccLink('');
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
      vendor_url: vendorUrl.trim() || null,
      order_status: orderStatus,
    });
    setIsSubmitting(false);
    onClose();
  }

  async function handleAddAccessory() {
    if (!costume || !onAddAccessory) return;
    setAddingAcc(true);
    await onAddAccessory({
      costume_id: costume.id,
      accessory_type: accType,
      description: accDescription.trim(),
      color: accColor.trim(),
      link: accLink.trim() || null,
    });
    setAccDescription('');
    setAccColor('');
    setAccLink('');
    setShowAccForm(false);
    setAddingAcc(false);
  }

  const pieceOptions = [
    { value: '', label: 'Select a piece...' },
    ...pieces.map((p) => ({ value: p.id, label: p.title })),
  ];

  const orderStatusOptions = COSTUME_ORDER_STATUSES.map((s) => ({
    value: s,
    label: ORDER_STATUS_LABELS[s] ?? s,
  }));

  const accessoryTypeOptions = ACCESSORY_TYPES.map((t) => ({
    value: t,
    label: t.charAt(0).toUpperCase() + t.slice(1),
  }));

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
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Order Status"
            options={orderStatusOptions}
            value={orderStatus}
            onChange={(e) => setOrderStatus(e.target.value)}
          />
          <Input
            label="Vendor URL"
            value={vendorUrl}
            onChange={(e) => setVendorUrl(e.target.value)}
            placeholder="https://..."
          />
        </div>
        <Textarea
          label="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Care instructions, vendor info..."
          rows={2}
        />

        {/* Accessories — only shown when editing an existing costume */}
        {costume && (
          <div className="pt-2 border-t border-border">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-text-primary">Accessories</h4>
              {!showAccForm && (
                <button
                  type="button"
                  onClick={() => setShowAccForm(true)}
                  className="text-xs text-accent hover:underline"
                >
                  + Add
                </button>
              )}
            </div>

            {accessories.length > 0 && (
              <div className="space-y-1.5 mb-3">
                {accessories.map((acc) => (
                  <div key={acc.id} className="flex items-center justify-between text-xs p-2 rounded-lg bg-surface-secondary/50">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-medium text-text-primary capitalize">{acc.accessory_type}</span>
                      {acc.description && <span className="text-text-tertiary truncate">{acc.description}</span>}
                      {acc.color && <span className="text-text-tertiary">({acc.color})</span>}
                    </div>
                    {onRemoveAccessory && (
                      <button
                        type="button"
                        onClick={() => onRemoveAccessory(acc.id)}
                        className="p-0.5 text-text-tertiary hover:text-danger-500 transition-colors shrink-0 ml-2"
                      >
                        <Trash2 size={11} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {accessories.length === 0 && !showAccForm && (
              <p className="text-xs text-text-tertiary mb-2">No accessories added.</p>
            )}

            {showAccForm && (
              <div className="space-y-2 p-3 rounded-xl bg-surface-secondary/40 border border-border">
                <div className="grid grid-cols-2 gap-2">
                  <Select
                    label="Type"
                    options={accessoryTypeOptions}
                    value={accType}
                    onChange={(e) => setAccType(e.target.value as AccessoryType)}
                  />
                  <Input
                    label="Color"
                    value={accColor}
                    onChange={(e) => setAccColor(e.target.value)}
                    placeholder="e.g. Nude"
                  />
                </div>
                <Input
                  label="Description"
                  value={accDescription}
                  onChange={(e) => setAccDescription(e.target.value)}
                  placeholder="e.g. Fishnet, rhinestone trim"
                />
                <Input
                  label="Link (optional)"
                  value={accLink}
                  onChange={(e) => setAccLink(e.target.value)}
                  placeholder="https://..."
                />
                <div className="flex justify-end gap-2 pt-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => setShowAccForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    loading={addingAcc}
                    onClick={handleAddAccessory}
                  >
                    Add
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

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
