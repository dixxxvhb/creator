import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { QuickAddPieceModal } from '@/components/pieces';
import { Music, Check, Plus } from 'lucide-react';
import type { Piece } from '@/types';
import { cn } from '@/lib/utils';

interface PiecePickerModalProps {
  open: boolean;
  onClose: () => void;
  pieces: Piece[];
  assignedPieceIds: string[];
  onToggle: (pieceId: string, assigned: boolean) => void;
}

export function PiecePickerModal({ open, onClose, pieces, assignedPieceIds, onToggle }: PiecePickerModalProps) {
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  return (
    <Modal open={open} onClose={onClose} title="Assign Pieces">
      <div className="space-y-4">
        <p className="text-sm text-text-secondary">
          Select pieces to include in this season.
        </p>
        {pieces.length === 0 ? (
          <p className="text-sm text-text-tertiary text-center py-6">No pieces created yet.</p>
        ) : (
          <div className="space-y-1.5 max-h-[350px] overflow-y-auto pr-1">
            {pieces.map((piece) => {
              const isAssigned = assignedPieceIds.includes(piece.id);
              return (
                <button
                  key={piece.id}
                  onClick={() => onToggle(piece.id, isAssigned)}
                  className={cn(
                    'flex items-center gap-3 w-full p-3 rounded-xl border transition-all text-left',
                    isAssigned
                      ? 'border-[var(--color-accent)] accent-bg-light'
                      : 'border-border hover:border-text-tertiary hover:bg-surface-secondary/50'
                  )}
                >
                  <div className="flex items-center justify-center w-9 h-9 rounded-lg accent-bg-light shrink-0">
                    {isAssigned ? (
                      <Check size={16} className="accent-text" />
                    ) : (
                      <Music size={16} className="accent-text" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-text-primary truncate">{piece.title}</p>
                    <p className="text-xs text-text-secondary">
                      {piece.dancer_count} dancer{piece.dancer_count !== 1 ? 's' : ''}
                      {piece.style ? ` · ${piece.style}` : ''}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
        <button
          type="button"
          onClick={() => setShowQuickAdd(true)}
          className="flex items-center gap-1.5 text-sm text-[var(--color-accent)] hover:underline"
        >
          <Plus size={14} /> New Piece
        </button>

        <div className="flex justify-end pt-2">
          <Button variant="secondary" onClick={onClose}>Done</Button>
        </div>
      </div>

      <QuickAddPieceModal
        open={showQuickAdd}
        onClose={() => setShowQuickAdd(false)}
        onCreated={(piece) => {
          onToggle(piece.id, false);
        }}
      />
    </Modal>
  );
}
