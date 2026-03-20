import { UserPlus, UserMinus } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import type { DancerPosition, Dancer } from '@/types';

interface DancerManageModalProps {
  open: boolean;
  onClose: () => void;
  /** All unique dancer positions (one per label, from active formation) */
  positions: DancerPosition[];
  rosterDancers: Dancer[];
  dancerCount: number;
  onAssign: (formationId: string, positionId: string, dancerId: string | null, color?: string) => void;
  activeFormationId: string | null;
  onAddDancer: () => void;
  onRemoveDancer: () => void;
}

export function DancerManageModal({
  open,
  onClose,
  positions,
  rosterDancers,
  dancerCount,
  onAssign,
  activeFormationId,
  onAddDancer,
  onRemoveDancer,
}: DancerManageModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={`Dancers (${dancerCount})`}>
      <div className="space-y-4">
        {/* Dancer list */}
        {positions.length === 0 ? (
          <p className="text-sm text-text-tertiary text-center py-4">
            No dancers in this piece yet.
          </p>
        ) : (
          <div className="space-y-2 max-h-[50vh] overflow-y-auto">
            {positions.map((pos) => {
              const assignedDancer = pos.dancer_id
                ? rosterDancers.find((d) => d.id === pos.dancer_id)
                : null;
              return (
                <div
                  key={pos.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-surface-secondary/50 border border-border/50"
                >
                  <span
                    className="w-4 h-4 rounded-full shrink-0 ring-2 ring-white/20"
                    style={{ backgroundColor: pos.color }}
                  />
                  <span className="font-mono text-sm font-semibold text-text-primary w-6 shrink-0">
                    {pos.dancer_label}
                  </span>
                  <select
                    value={pos.dancer_id ?? ''}
                    onChange={(e) => {
                      if (!activeFormationId) return;
                      const selectedId = e.target.value || null;
                      const rd = selectedId ? rosterDancers.find((d) => d.id === selectedId) : null;
                      onAssign(activeFormationId, pos.id, selectedId, rd?.color);
                    }}
                    className="flex-1 text-sm bg-surface-elevated border border-border rounded-lg px-3 py-2 text-text-primary min-w-0"
                  >
                    <option value="">Unassigned</option>
                    {rosterDancers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.full_name} ({d.short_name})
                      </option>
                    ))}
                  </select>
                  {assignedDancer && (
                    <span className="text-xs text-text-tertiary shrink-0">
                      ({Math.round(pos.x)}, {Math.round(pos.y)})
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2 border-t border-border">
          <Button
            variant="secondary"
            onClick={() => {
              onClose();
              onAddDancer();
            }}
          >
            <UserPlus size={14} />
            Add Dancer
          </Button>
          <Button
            variant="secondary"
            onClick={onRemoveDancer}
            disabled={dancerCount <= 0}
          >
            <UserMinus size={14} />
            Remove Last
          </Button>
          <div className="flex-1" />
          <Button variant="secondary" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
}
