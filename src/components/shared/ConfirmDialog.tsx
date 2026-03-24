import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import type { LucideIcon } from 'lucide-react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  confirmVariant?: 'primary' | 'danger';
  icon?: LucideIcon;
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  confirmVariant = 'danger',
  icon: Icon = AlertTriangle,
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="flex gap-4 mb-6">
        <div className="w-10 h-10 rounded-xl bg-danger-50 flex items-center justify-center shrink-0">
          <Icon size={20} className="text-danger-500" />
        </div>
        <p className="text-sm text-text-secondary leading-relaxed pt-1.5">
          {description}
        </p>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant={confirmVariant} onClick={onConfirm} loading={loading}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
