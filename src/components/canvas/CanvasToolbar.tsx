import {
  Grid3X3,
  Magnet,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  MousePointer2,
  Pen,
  PenLine,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CanvasMode } from '@/types';

interface CanvasToolbarProps {
  showGrid: boolean;
  snapToGrid: boolean;
  zoom: number;
  canGoPrev: boolean;
  canGoNext: boolean;
  canvasMode: CanvasMode;
  hasSelectedPath: boolean;
  onToggleGrid: () => void;
  onToggleSnap: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSetCanvasMode: (mode: CanvasMode) => void;
  onDeletePath: () => void;
}

function ToolButton({
  active,
  disabled,
  onClick,
  title,
  children,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        'p-2 rounded-lg transition-colors',
        active
          ? 'bg-electric-500/20 text-electric-400'
          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50',
        disabled && 'opacity-30 pointer-events-none'
      )}
    >
      {children}
    </button>
  );
}

export function CanvasToolbar({
  showGrid,
  snapToGrid,
  zoom,
  canGoPrev,
  canGoNext,
  canvasMode,
  hasSelectedPath,
  onToggleGrid,
  onToggleSnap,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onPrev,
  onNext,
  onSetCanvasMode,
  onDeletePath,
}: CanvasToolbarProps) {
  return (
    <div className="flex items-center gap-1 bg-slate-800/80 backdrop-blur-sm border border-slate-700 rounded-xl px-2 py-1">
      {/* Formation navigation */}
      <ToolButton onClick={onPrev} disabled={!canGoPrev} title="Previous formation">
        <ChevronLeft size={16} />
      </ToolButton>
      <ToolButton onClick={onNext} disabled={!canGoNext} title="Next formation">
        <ChevronRight size={16} />
      </ToolButton>

      <div className="w-px h-5 bg-slate-700 mx-1" />

      {/* Canvas mode selector */}
      <ToolButton onClick={() => onSetCanvasMode('select')} active={canvasMode === 'select'} title="Select mode">
        <MousePointer2 size={16} />
      </ToolButton>
      <ToolButton onClick={() => onSetCanvasMode('draw-freehand')} active={canvasMode === 'draw-freehand'} title="Draw freehand path">
        <Pen size={16} />
      </ToolButton>
      <ToolButton onClick={() => onSetCanvasMode('draw-geometric')} active={canvasMode === 'draw-geometric'} title="Draw geometric path">
        <PenLine size={16} />
      </ToolButton>

      {hasSelectedPath && (
        <ToolButton onClick={onDeletePath} title="Delete selected path">
          <Trash2 size={16} />
        </ToolButton>
      )}

      <div className="w-px h-5 bg-slate-700 mx-1" />

      {/* Grid & snap */}
      <ToolButton onClick={onToggleGrid} active={showGrid} title="Toggle grid">
        <Grid3X3 size={16} />
      </ToolButton>
      <ToolButton onClick={onToggleSnap} active={snapToGrid} title="Snap to grid">
        <Magnet size={16} />
      </ToolButton>

      <div className="w-px h-5 bg-slate-700 mx-1" />

      {/* Zoom */}
      <ToolButton onClick={onZoomOut} title="Zoom out">
        <ZoomOut size={16} />
      </ToolButton>
      <button
        onClick={onZoomReset}
        title="Reset zoom"
        className="text-xs text-slate-400 hover:text-slate-200 font-mono w-10 text-center transition-colors"
      >
        {Math.round(zoom * 100)}%
      </button>
      <ToolButton onClick={onZoomIn} title="Zoom in">
        <ZoomIn size={16} />
      </ToolButton>
    </div>
  );
}
