import { Button } from '@/components/ui/Button';

interface DeletePieceDialogProps {
  open: boolean;
  pieceTitle: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DeletePieceDialog({ open, pieceTitle, onCancel, onConfirm }: DeletePieceDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-surface-elevated rounded-2xl border border-border p-6 max-w-sm w-full mx-4 shadow-xl">
        <h3 className="text-lg font-bold text-text-primary mb-2">Delete Piece</h3>
        <p className="text-sm text-text-secondary mb-6">
          This will permanently delete <strong>{pieceTitle}</strong> and all its formations, positions, and paths. This cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onCancel}>Cancel</Button>
          <Button variant="danger" onClick={onConfirm}>Delete</Button>
        </div>
      </div>
    </div>
  );
}
