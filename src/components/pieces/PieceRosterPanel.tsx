import { memo } from 'react';
import { UserPlus, UserMinus } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import type { DancerPosition, Dancer } from '@/types';

interface PieceRosterPanelProps {
  positions: DancerPosition[];
  rosterDancers: Dancer[];
  dancerCount: number;
  activeFormationId: string | null;
  onAssign: (formationId: string, positionId: string, dancerId: string | null, color?: string) => void;
  onAddDancer: () => void;
  onRemoveDancer: () => void;
}

const RosterPositionRow = memo(function RosterPositionRow({
  pos,
  rosterDancers,
  formationId,
  onAssign,
}: {
  pos: DancerPosition;
  rosterDancers: Dancer[];
  formationId: string;
  onAssign: (formationId: string, positionId: string, dancerId: string | null, color?: string) => void;
}) {
  const assignedDancer = pos.dancer_id ? rosterDancers.find((d) => d.id === pos.dancer_id) : null;
  return (
    <div className="flex items-center gap-2 text-sm text-text-primary">
      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: pos.color }} />
      <span className="text-xs font-medium w-5 shrink-0">{assignedDancer?.short_name?.charAt(0).toUpperCase() ?? pos.dancer_label}</span>
      <select
        value={pos.dancer_id ?? ''}
        onChange={(e) => {
          const selectedId = e.target.value || null;
          const dancer = selectedId ? rosterDancers.find((d) => d.id === selectedId) : null;
          onAssign(formationId, pos.id, selectedId, dancer?.color);
        }}
        className="flex-1 text-xs bg-surface-secondary border border-border rounded px-1.5 py-1 text-text-primary min-w-0"
      >
        <option value="">Unassigned</option>
        {rosterDancers.map((d) => (
          <option key={d.id} value={d.id}>{d.short_name}</option>
        ))}
      </select>
    </div>
  );
});

export function PieceRosterPanel({
  positions,
  rosterDancers,
  dancerCount,
  activeFormationId,
  onAssign,
  onAddDancer,
  onRemoveDancer,
}: PieceRosterPanelProps) {
  return (
    <div className="max-w-2xl">
      <Card>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-text-primary">
              Dancers ({dancerCount})
            </h4>
            <div className="flex items-center gap-1.5">
              <Button variant="secondary" size="sm" onClick={onAddDancer}>
                <UserPlus size={12} />
                Add
              </Button>
              <Button variant="secondary" size="sm" onClick={onRemoveDancer} disabled={dancerCount <= 0}>
                <UserMinus size={12} />
              </Button>
            </div>
          </div>
          {positions.length === 0 ? (
            <p className="text-sm text-text-tertiary">No dancers in this formation</p>
          ) : (
            <div className="space-y-1.5">
              {positions.map((pos) => (
                <RosterPositionRow
                  key={pos.id}
                  pos={pos}
                  rosterDancers={rosterDancers}
                  formationId={activeFormationId!}
                  onAssign={onAssign}
                />
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
