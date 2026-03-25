import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, X, Trash2, ArrowRight, Pencil, Play, Lock } from 'lucide-react';
import { useTierStore } from '@/stores/tierStore';
import type { Formation, DancerPosition, DancerPath, Piece, Dancer } from '@/types';

interface ThumbnailStripProps {
  piece: Piece;
  formations: Formation[];
  positions: Record<string, DancerPosition[]>;
  paths: Record<string, DancerPath[]>;
  rosterDancers?: Dancer[];
  activeFormationId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onDelete?: (id: string) => void;
  onDeletePath?: (formationId: string, dancerLabel: string) => void;
  onDeleteAllPaths?: (formationId: string) => void;
  onEditPath?: (formationId: string, dancerLabel: string) => void;
  onPlayPath?: (formationId: string, dancerLabel: string) => void;
  onUpdateTransition?: (formationId: string, updates: { transition_duration_ms?: number; transition_easing?: string }) => void;
  bpm?: number | null;
}

function MiniFormation({
  formation,
  positions,
  piece,
  isActive,
  canDelete,
  onClick,
  onDelete,
}: {
  formation: Formation;
  positions: DancerPosition[];
  piece: Piece;
  isActive: boolean;
  canDelete: boolean;
  onClick: () => void;
  onDelete?: () => void;
}) {
  const thumbW = 120;
  const thumbH = 80;
  const scale = Math.min(thumbW / piece.stage_width, thumbH / piece.stage_depth) * 0.85;
  const offsetX = (thumbW - piece.stage_width * scale) / 2;
  const offsetY = (thumbH - piece.stage_depth * scale) / 2;

  return (
    <button
      onClick={onClick}
      className={`shrink-0 flex flex-col items-center gap-1 group relative`}
    >
      {/* Delete button */}
      {canDelete && (
        <span
          onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
          className="absolute -top-1.5 -right-1.5 z-10 w-5 h-5 rounded-full bg-danger-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-danger-600"
          title="Delete formation"
        >
          <X size={12} />
        </span>
      )}
      <div
        className={`w-[120px] h-[80px] rounded-lg border-2 relative overflow-hidden transition-colors ${
          isActive
            ? 'bg-surface-elevated'
            : 'border-border bg-surface-secondary hover:border-text-tertiary'
        }`}
        style={isActive ? { borderColor: 'var(--color-accent)' } : undefined}
      >
        {/* Mini stage background */}
        <svg width={thumbW} height={thumbH}>
          <rect
            x={offsetX}
            y={offsetY}
            width={piece.stage_width * scale}
            height={piece.stage_depth * scale}
            fill="var(--color-surface-secondary, #1a1f2e)"
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
          isActive ? 'accent-text' : 'text-text-tertiary group-hover:text-text-secondary'
        }`}
      >
        {formation.label || `Formation ${formation.index + 1}`}
      </span>
    </button>
  );
}

/** Path indicator between two formation thumbnails */
function TransitionIndicator({
  formationId,
  nextFormationId,
  formationPaths,
  allPositions,
  dancerNameMap,
  onDeletePath,
  onDeleteAll,
  onEditPath,
  onPlayPath,
  transitionDurationMs,
  transitionEasing,
  bpm,
  onUpdateTransition,
}: {
  formationId: string;
  nextFormationId: string;
  formationPaths: DancerPath[];
  allPositions: DancerPosition[];
  dancerNameMap: Map<string, string>;
  onDeletePath?: (formationId: string, dancerLabel: string) => void;
  onDeleteAll?: (formationId: string) => void;
  onEditPath?: (formationId: string, dancerLabel: string) => void;
  onPlayPath?: (formationId: string, dancerLabel: string) => void;
  transitionDurationMs: number;
  transitionEasing: string;
  bpm?: number | null;
  onUpdateTransition?: (formationId: string, updates: { transition_duration_ms?: number; transition_easing?: string }) => void;
}) {
  const hasTransitionAnimations = useTierStore((s) => s.hasFeature('transition_animations'));
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const count = formationPaths.length;

  // Compute dropdown position from button rect
  useEffect(() => {
    if (!open || !btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    setPos({ top: rect.top, left: rect.left + rect.width / 2 });
  }, [open]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (btnRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="shrink-0 flex flex-col items-center justify-center self-start mt-5">
      <button
        ref={btnRef}
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium transition-colors ${
          count > 0
            ? 'bg-[var(--color-accent)]/15 text-[var(--color-accent)] hover:bg-[var(--color-accent)]/25'
            : 'text-text-tertiary hover:text-text-secondary'
        }`}
        title={count > 0 ? `${count} path${count !== 1 ? 's' : ''} — click to manage` : 'No paths'}
      >
        <ArrowRight size={10} />
        {count > 0 && <span>{count}</span>}
      </button>
      <span className="text-[9px] text-text-tertiary mt-0.5">
        {(transitionDurationMs / 1000).toFixed(1)}s
      </span>

      {/* Portal dropdown — escapes overflow:auto parent */}
      {open && pos && createPortal(
        <div
          className="fixed z-50 bg-surface-elevated border border-border rounded-lg shadow-lg p-1.5 min-w-[180px]"
          style={{ top: pos.top - 4, left: pos.left, transform: 'translate(-50%, -100%)' }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Transition controls */}
          {hasTransitionAnimations ? (
          <div className="px-2 py-1.5 space-y-2">
            <div>
              <label className="block text-[10px] font-medium text-text-secondary mb-1">
                Duration: {transitionDurationMs}ms
                {bpm ? ` (${(transitionDurationMs / (60000 / bpm)).toFixed(1)} counts)` : ''}
              </label>
              <input
                type="range"
                min={500}
                max={5000}
                step={100}
                value={transitionDurationMs}
                onChange={(e) => onUpdateTransition?.(nextFormationId, { transition_duration_ms: parseInt(e.target.value) })}
                className="w-full h-1.5 accent-[var(--color-accent)]"
              />
              <div className="flex justify-between text-[9px] text-text-tertiary mt-0.5">
                <span>0.5s</span>
                <span>5s</span>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-medium text-text-secondary mb-1">Easing</label>
              <select
                value={transitionEasing}
                onChange={(e) => onUpdateTransition?.(nextFormationId, { transition_easing: e.target.value })}
                className="w-full rounded border border-border bg-surface-secondary px-2 py-1 text-[11px] text-text-primary focus:outline-none"
              >
                <option value="linear">Linear</option>
                <option value="ease-in">Ease In</option>
                <option value="ease-out">Ease Out</option>
                <option value="ease-in-out">Ease In-Out</option>
              </select>
            </div>
          </div>
          ) : (
          <div className="px-2 py-1.5 flex items-center gap-1.5 text-[10px] text-text-tertiary">
            <Lock size={10} />
            <span>Upgrade to Choreographer for transition controls</span>
          </div>
          )}
          {count > 0 && <div className="border-t border-border my-1" />}
          {count > 0 && (<>
          {formationPaths.map((path) => {
            const dancer = allPositions.find((p) => p.dancer_label === path.dancer_label);
            return (
              <div
                key={path.id}
                className="flex items-center gap-1.5 px-2 py-1 rounded text-[11px] hover:bg-surface-secondary/50"
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: dancer?.color ?? '#3B82F6' }}
                />
                {dancer?.dancer_id && dancerNameMap.has(dancer.dancer_id) ? (
                  <span className="flex-1 truncate">{dancerNameMap.get(dancer.dancer_id)}</span>
                ) : (
                  <span className="flex-1 font-mono">{path.dancer_label}</span>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditPath?.(formationId, path.dancer_label);
                    setOpen(false);
                  }}
                  className="p-0.5 text-text-tertiary hover:text-[var(--color-accent)] transition-colors"
                  title="Edit path"
                >
                  <Pencil size={10} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onPlayPath?.(formationId, path.dancer_label);
                    setOpen(false);
                  }}
                  className="p-0.5 text-text-tertiary hover:text-green-400 transition-colors"
                  title="Play this transition"
                >
                  <Play size={10} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeletePath?.(formationId, path.dancer_label);
                  }}
                  className="p-0.5 text-text-tertiary hover:text-red-400 transition-colors"
                  title="Delete path"
                >
                  <Trash2 size={10} />
                </button>
              </div>
            );
          })}
          <div className="border-t border-border mt-1 pt-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteAll?.(formationId);
                setOpen(false);
              }}
              className="w-full text-left px-2 py-1 rounded text-[11px] text-red-400 hover:bg-red-500/10 transition-colors"
            >
              Delete all paths
            </button>
          </div>
          </>)}
        </div>,
        document.body
      )}
    </div>
  );
}

export function ThumbnailStrip({
  piece,
  formations,
  positions,
  paths,
  rosterDancers = [],
  activeFormationId,
  onSelect,
  onAdd,
  onDelete,
  onDeletePath,
  onDeleteAllPaths,
  onEditPath,
  onPlayPath,
  onUpdateTransition,
  bpm,
}: ThumbnailStripProps) {
  const dancerNameMap = new Map(rosterDancers.map((d) => [d.id, d.short_name]));

  return (
    <div className="flex gap-1.5 overflow-x-auto pb-2 px-1 items-end">
      {formations.map((f, i) => (
        <div key={f.id} className="contents">
          <MiniFormation
            formation={f}
            positions={positions[f.id] ?? []}
            piece={piece}
            isActive={f.id === activeFormationId}
            canDelete={formations.length > 1}
            onClick={() => onSelect(f.id)}
            onDelete={() => onDelete?.(f.id)}
          />
          {/* Transition indicator between this and next formation */}
          {i < formations.length - 1 && (
            <TransitionIndicator
              formationId={f.id}
              nextFormationId={formations[i + 1]?.id ?? ''}
              formationPaths={paths[f.id] ?? []}
              allPositions={positions[f.id] ?? []}
              dancerNameMap={dancerNameMap}
              onDeletePath={onDeletePath}
              onDeleteAll={onDeleteAllPaths}
              onEditPath={onEditPath}
              onPlayPath={onPlayPath}
              transitionDurationMs={formations[i + 1]?.transition_duration_ms ?? 2000}
              transitionEasing={formations[i + 1]?.transition_easing ?? 'ease-in-out'}
              bpm={bpm}
              onUpdateTransition={onUpdateTransition}
            />
          )}
        </div>
      ))}

      {/* Add formation button */}
      <button
        onClick={onAdd}
        className="shrink-0 w-[120px] h-[80px] rounded-lg border-2 border-dashed border-border flex items-center justify-center text-text-tertiary transition-colors"
        style={{ ['--hover-border' as string]: 'var(--color-accent)' }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-accent)'; e.currentTarget.style.color = 'var(--color-accent)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = ''; e.currentTarget.style.color = ''; }}
        title="Add formation"
      >
        <Plus size={20} />
      </button>
    </div>
  );
}
