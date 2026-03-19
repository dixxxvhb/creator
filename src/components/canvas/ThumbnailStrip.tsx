import { Plus } from 'lucide-react';
import type { Formation, DancerPosition, Piece } from '@/types';

interface ThumbnailStripProps {
  piece: Piece;
  formations: Formation[];
  positions: Record<string, DancerPosition[]>;
  activeFormationId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
}

function MiniFormation({
  formation,
  positions,
  piece,
  isActive,
  onClick,
}: {
  formation: Formation;
  positions: DancerPosition[];
  piece: Piece;
  isActive: boolean;
  onClick: () => void;
}) {
  const thumbW = 120;
  const thumbH = 80;
  const scale = Math.min(thumbW / piece.stage_width, thumbH / piece.stage_depth) * 0.85;
  const offsetX = (thumbW - piece.stage_width * scale) / 2;
  const offsetY = (thumbH - piece.stage_depth * scale) / 2;

  return (
    <button
      onClick={onClick}
      className={`shrink-0 flex flex-col items-center gap-1 group`}
    >
      <div
        className={`w-[120px] h-[80px] rounded-lg border-2 relative overflow-hidden transition-colors ${
          isActive
            ? 'border-electric-500 bg-slate-800'
            : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
        }`}
      >
        {/* Mini stage background */}
        <svg width={thumbW} height={thumbH}>
          <rect
            x={offsetX}
            y={offsetY}
            width={piece.stage_width * scale}
            height={piece.stage_depth * scale}
            fill="#1a1f2e"
            rx={2}
          />
          {/* Dancer dots */}
          {positions.map((pos) => (
            <circle
              key={pos.id}
              cx={offsetX + pos.x * scale}
              cy={offsetY + pos.y * scale}
              r={Math.max(3, 4 * scale)}
              fill={pos.color}
            />
          ))}
        </svg>
      </div>
      <span
        className={`text-[10px] font-medium truncate max-w-[120px] ${
          isActive ? 'text-electric-400' : 'text-slate-500 group-hover:text-slate-400'
        }`}
      >
        {formation.label || `Formation ${formation.index + 1}`}
      </span>
    </button>
  );
}

export function ThumbnailStrip({
  piece,
  formations,
  positions,
  activeFormationId,
  onSelect,
  onAdd,
}: ThumbnailStripProps) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2 px-1 items-end">
      {formations.map((f) => (
        <MiniFormation
          key={f.id}
          formation={f}
          positions={positions[f.id] ?? []}
          piece={piece}
          isActive={f.id === activeFormationId}
          onClick={() => onSelect(f.id)}
        />
      ))}

      {/* Add formation button */}
      <button
        onClick={onAdd}
        className="shrink-0 w-[120px] h-[80px] rounded-lg border-2 border-dashed border-slate-700 hover:border-electric-500/50 flex items-center justify-center text-slate-500 hover:text-electric-400 transition-colors"
        title="Add formation"
      >
        <Plus size={20} />
      </button>
    </div>
  );
}
