import { useState, memo } from 'react';
import { Star, Trash2 } from 'lucide-react';
import type { DancerPosition, Dancer } from '@/types';

export const PositionRow = memo(function PositionRow({
  pos,
  rosterDancers,
  activeFormationId,
  isFocal,
  onToggleFocal,
  onAssign,
  onQuickAdd,
  onRemove,
}: {
  pos: DancerPosition;
  rosterDancers: Dancer[];
  activeFormationId: string;
  isFocal: boolean;
  onToggleFocal: (dancerId: string | null) => void;
  onAssign: (formationId: string, positionId: string, dancerId: string | null, color?: string) => void;
  onQuickAdd: (name: string, positionId: string) => void;
  onRemove?: (dancerLabel: string) => void;
}) {
  const [quickName, setQuickName] = useState('');
  const [mode, setMode] = useState<'input' | 'select'>('input');
  const assignedDancer = pos.dancer_id ? rosterDancers.find((d) => d.id === pos.dancer_id) : null;

  if (assignedDancer) {
    // Assigned — show name with option to unassign
    return (
      <div className="flex items-center gap-2 text-sm text-text-primary">
        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: pos.color }} />
        <span className="text-xs font-medium truncate flex-1">{assignedDancer.short_name}</span>
        <button
          type="button"
          onClick={() => onToggleFocal(isFocal ? null : pos.dancer_id)}
          className={`p-0.5 transition-colors ${isFocal ? 'text-amber-400' : 'text-text-tertiary hover:text-amber-400'}`}
          title={isFocal ? 'Remove lead dancer' : 'Set as lead dancer'}
        >
          <Star size={12} fill={isFocal ? 'currentColor' : 'none'} />
        </button>
        <button
          type="button"
          onClick={() => onAssign(activeFormationId, pos.id, null)}
          className="text-[10px] text-text-tertiary hover:text-text-primary transition-colors"
        >
          remove
        </button>
        <span className="text-text-tertiary text-[10px] shrink-0">
          ({Math.round(pos.x)},{Math.round(pos.y)})
        </span>
        {onRemove && (
          <button
            type="button"
            onClick={() => onRemove(pos.dancer_label)}
            className="p-0.5 text-text-tertiary hover:text-red-400 transition-colors"
            title={`Remove dancer ${pos.dancer_label} from piece`}
          >
            <Trash2 size={11} />
          </button>
        )}
      </div>
    );
  }

  // Unassigned — show quick-add input or dropdown
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-3 h-3 rounded-full shrink-0 border border-dashed border-text-tertiary" />
      {mode === 'input' ? (
        <form
          className="flex-1 flex items-center gap-1.5"
          onSubmit={(e) => {
            e.preventDefault();
            if (quickName.trim()) {
              onQuickAdd(quickName.trim(), pos.id);
              setQuickName('');
            }
          }}
        >
          <input
            type="text"
            value={quickName}
            onChange={(e) => setQuickName(e.target.value)}
            placeholder="Type name to add..."
            className="flex-1 text-xs bg-surface-secondary border border-border rounded px-2 py-1 text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-border-focus min-w-0"
          />
          <button
            type="button"
            onClick={() => setMode('select')}
            className="text-[10px] text-text-tertiary hover:text-text-primary transition-colors whitespace-nowrap"
          >
            pick
          </button>
        </form>
      ) : (
        <div className="flex-1 flex items-center gap-1.5">
          <select
            value=""
            onChange={(e) => {
              const selectedId = e.target.value || null;
              const rd = selectedId ? rosterDancers.find((d) => d.id === selectedId) : null;
              if (rd) onAssign(activeFormationId, pos.id, selectedId, rd.color);
              setMode('input');
            }}
            className="flex-1 text-xs bg-surface-secondary border border-border rounded px-1.5 py-1 text-text-primary min-w-0"
          >
            <option value="">Choose existing...</option>
            {rosterDancers.map((d) => (
              <option key={d.id} value={d.id}>{d.short_name}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setMode('input')}
            className="text-[10px] text-text-tertiary hover:text-text-primary transition-colors whitespace-nowrap"
          >
            new
          </button>
        </div>
      )}
      {onRemove && (
        <button
          type="button"
          onClick={() => onRemove(pos.dancer_label)}
          className="p-0.5 text-text-tertiary hover:text-red-400 transition-colors shrink-0"
          title={`Remove dancer ${pos.dancer_label} from piece`}
        >
          <Trash2 size={11} />
        </button>
      )}
    </div>
  );
});
