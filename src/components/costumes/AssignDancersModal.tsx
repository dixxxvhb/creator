import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Check } from 'lucide-react';
import type { Dancer, CostumeAssignment } from '@/types';
import { cn } from '@/lib/utils';

interface AssignDancersModalProps {
  open: boolean;
  onClose: () => void;
  dancers: Dancer[];
  assignments: CostumeAssignment[];
  onToggle: (dancerId: string, assigned: boolean) => void;
}

export function AssignDancersModal({ open, onClose, dancers, assignments, onToggle }: AssignDancersModalProps) {
  const assignedIds = new Set(assignments.map((a) => a.dancer_id));

  return (
    <Modal open={open} onClose={onClose} title="Assign Dancers">
      <div className="space-y-4">
        <p className="text-sm text-text-secondary">Select dancers to assign to this costume.</p>
        {dancers.length === 0 ? (
          <p className="text-sm text-text-tertiary text-center py-6">No dancers in roster yet.</p>
        ) : (
          <div className="space-y-1.5 max-h-[350px] overflow-y-auto pr-1">
            {dancers.map((dancer) => {
              const isAssigned = assignedIds.has(dancer.id);
              return (
                <button
                  key={dancer.id}
                  onClick={() => onToggle(dancer.id, isAssigned)}
                  className={cn(
                    'flex items-center gap-3 w-full p-3 rounded-xl border transition-all text-left',
                    isAssigned
                      ? 'border-[var(--color-accent)] accent-bg-light'
                      : 'border-border hover:border-text-tertiary hover:bg-surface-secondary/50'
                  )}
                >
                  <span
                    className="w-4 h-4 rounded-full shrink-0 flex items-center justify-center"
                    style={{ backgroundColor: dancer.color }}
                  >
                    {isAssigned && <Check size={10} className="text-white" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-text-primary">{dancer.full_name}</p>
                    {dancer.short_name && (
                      <p className="text-xs text-text-secondary">{dancer.short_name}</p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
        <div className="flex justify-end pt-2">
          <Button variant="secondary" onClick={onClose}>Done</Button>
        </div>
      </div>
    </Modal>
  );
}
