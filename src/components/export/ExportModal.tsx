import { useState } from 'react';
import { Image, FileText, Printer } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

export type ExportFormat = 'png' | 'pdf' | 'print';

interface ExportModalProps {
  open: boolean;
  onClose: () => void;
  onExport: (format: ExportFormat) => void;
  isExporting: boolean;
  formationCount: number;
}

const OPTIONS: { format: ExportFormat; icon: typeof Image; label: string; description: string }[] = [
  {
    format: 'png',
    icon: Image,
    label: 'PNG Image',
    description: 'Export current formation as a high-res image',
  },
  {
    format: 'pdf',
    icon: FileText,
    label: 'PDF Document',
    description: 'All formations with notes, one page each',
  },
  {
    format: 'print',
    icon: Printer,
    label: 'Print',
    description: 'Open browser print dialog with a clean layout',
  },
];

export function ExportModal({ open, onClose, onExport, isExporting, formationCount }: ExportModalProps) {
  const [selected, setSelected] = useState<ExportFormat>('png');

  return (
    <Modal open={open} onClose={onClose} title="Export Piece">
      <div className="space-y-4">
        <p className="text-sm text-text-secondary">
          Choose an export format. {formationCount} formation{formationCount !== 1 ? 's' : ''} will be included in PDF export.
        </p>

        <div className="space-y-2">
          {OPTIONS.map(({ format, icon: Icon, label, description }) => (
            <button
              key={format}
              onClick={() => setSelected(format)}
              className={`flex items-start gap-3 w-full p-3 rounded-xl border transition-all text-left ${
                selected === format
                  ? 'border-[var(--color-accent)] accent-bg-light'
                  : 'border-border hover:border-text-tertiary hover:bg-surface-secondary/50'
              }`}
            >
              <Icon size={20} className={selected === format ? 'text-[var(--color-accent)]' : 'text-text-tertiary'} />
              <div>
                <p className="text-sm font-medium text-text-primary">{label}</p>
                <p className="text-xs text-text-secondary">{description}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onExport(selected)} loading={isExporting}>
            Export
          </Button>
        </div>
      </div>
    </Modal>
  );
}
