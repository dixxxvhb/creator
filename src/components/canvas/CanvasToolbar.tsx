import {
  Grid3X3,
  Magnet,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  MousePointer2,
  Pen,
  Trash2,
  LayoutGrid,
  UserPlus,
  UserMinus,
  ArrowUpFromLine,
  ArrowDownFromLine,
  Hash,
  Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTierStore } from '@/stores/tierStore';
import type { CanvasMode } from '@/types';
import type { AudiencePosition } from '@/stores/uiStore';

interface CanvasToolbarProps {
  showGrid: boolean;
  snapToGrid: boolean;
  showStageNumbers: boolean;
  zoom: number;
  canGoPrev: boolean;
  canGoNext: boolean;
  canvasMode: CanvasMode;
  hasSelectedPath: boolean;
  dancerCount: number;
  audiencePosition: AudiencePosition;
  onOpenTemplates: () => void;
  onToggleGrid: () => void;
  onToggleSnap: () => void;
  onToggleStageNumbers: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSetCanvasMode: (mode: CanvasMode) => void;
  onDeletePath: () => void;
  onAddDancer: () => void;
  onRemoveDancer: () => void;
  onToggleAudiencePosition: () => void;
}

function ToolButton({
  active,
  disabled,
  onClick,
  title,
  label,
  children,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  title: string;
  label?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        'flex items-center gap-1 px-2 py-1.5 rounded-lg transition-colors text-xs',
        active
          ? 'accent-bg-light accent-text'
          : 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary',
        disabled && 'opacity-30 pointer-events-none'
      )}
    >
      {children}
      {label && <span className="hidden sm:inline">{label}</span>}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-5 bg-border mx-0.5 shrink-0" />;
}

export function CanvasToolbar({
  showGrid,
  snapToGrid,
  showStageNumbers,
  zoom,
  canGoPrev,
  canGoNext,
  canvasMode,
  hasSelectedPath,
  dancerCount,
  audiencePosition,
  onOpenTemplates,
  onToggleGrid,
  onToggleSnap,
  onToggleStageNumbers,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onPrev,
  onNext,
  onSetCanvasMode,
  onDeletePath,
  onAddDancer,
  onRemoveDancer,
  onToggleAudiencePosition,
}: CanvasToolbarProps) {
  const hasDrawnPathways = useTierStore((s) => s.hasFeature('drawn_pathways'));

  return (
    <div className="flex items-center gap-0.5 bg-surface-elevated/80 backdrop-blur-sm border border-border rounded-xl px-2 py-1 flex-wrap">
      {/* Formation navigation */}
      <ToolButton onClick={onPrev} disabled={!canGoPrev} title="Previous formation (keyboard: ←)">
        <ChevronLeft size={16} />
      </ToolButton>
      <ToolButton onClick={onNext} disabled={!canGoNext} title="Next formation (keyboard: →)">
        <ChevronRight size={16} />
      </ToolButton>

      <Divider />

      {/* Canvas mode selector */}
      <ToolButton onClick={() => onSetCanvasMode('select')} active={canvasMode === 'select'} title="Select & move dancers" label="Select">
        <MousePointer2 size={14} />
      </ToolButton>
      <ToolButton onClick={() => onSetCanvasMode('draw-freehand')} active={canvasMode === 'draw-freehand' || canvasMode === 'draw-geometric'} disabled={!hasDrawnPathways} title={hasDrawnPathways ? "Draw a path by dragging a dancer" : "Upgrade to Choreographer to draw paths"} label="Draw">
        <Pen size={14} />
        {!hasDrawnPathways && <Lock size={10} className="text-text-tertiary" />}
      </ToolButton>

      {hasSelectedPath && (
        <ToolButton onClick={onDeletePath} title="Delete the selected path">
          <Trash2 size={14} />
        </ToolButton>
      )}

      <Divider />

      {/* Dancer management */}
      <ToolButton onClick={onAddDancer} title="Add a dancer to this piece" label="Add">
        <UserPlus size={14} />
      </ToolButton>
      <ToolButton onClick={onRemoveDancer} disabled={dancerCount <= 1} title="Remove the last dancer from this piece" label="Remove">
        <UserMinus size={14} />
      </ToolButton>

      <Divider />

      {/* Templates — accent-styled for discoverability */}
      <button
        onClick={onOpenTemplates}
        title="Apply a formation template (auto-arrange dancers)"
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[var(--color-accent)]/15 text-[var(--color-accent)] hover:bg-[var(--color-accent)]/25 transition-colors"
      >
        <LayoutGrid size={14} />
        <span>Template</span>
      </button>

      <Divider />

      {/* Grid & snap */}
      <ToolButton onClick={onToggleGrid} active={showGrid} title="Show/hide alignment grid" label="Grid">
        <Grid3X3 size={14} />
      </ToolButton>
      <ToolButton onClick={onToggleSnap} active={snapToGrid} title="Snap dancer positions to nearest grid line when dragging" label="Snap">
        <Magnet size={14} />
      </ToolButton>
      <ToolButton onClick={onToggleStageNumbers} active={showStageNumbers} title="Show stage position numbers along the front edge (0, 2, 4, 6...)" label="Numbers">
        <Hash size={14} />
      </ToolButton>
      <ToolButton onClick={onToggleAudiencePosition} title={`Audience at ${audiencePosition === 'top' ? 'top' : 'bottom'} — click to flip`} label={audiencePosition === 'top' ? 'Aud Top' : 'Aud Bot'}>
        {audiencePosition === 'top' ? <ArrowUpFromLine size={14} /> : <ArrowDownFromLine size={14} />}
      </ToolButton>

      <Divider />

      {/* Zoom */}
      <ToolButton onClick={onZoomOut} title="Zoom out">
        <ZoomOut size={14} />
      </ToolButton>
      <button
        onClick={onZoomReset}
        title="Reset zoom to 100%"
        className="text-xs text-text-secondary hover:text-text-primary font-mono w-10 text-center transition-colors"
      >
        {Math.round(zoom * 100)}%
      </button>
      <ToolButton onClick={onZoomIn} title="Zoom in">
        <ZoomIn size={14} />
      </ToolButton>
    </div>
  );
}
