import { useRef, useState, useEffect, useCallback } from 'react';
import { Stage, Layer, Rect, Line, Text } from 'react-konva';
import type Konva from 'konva';
import { GridLayer } from './GridLayer';
import { DancerLayer } from './DancerLayer';
import { useUIStore } from '@/stores/uiStore';
import { useFormationStore } from '@/stores/formationStore';
import type { Piece, PlaybackPosition } from '@/types';

interface FormationCanvasProps {
  piece: Piece;
  playbackPositions?: PlaybackPosition[] | null;
}

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3.0;
const ZOOM_STEP = 0.1;

// Stage border/label colors
const STAGE_BG = '#141824';
const STAGE_BORDER = '#334155';
const LABEL_COLOR = '#64748b';

export function FormationCanvas({ piece, playbackPositions }: FormationCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);

  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });
  const [zoom, setZoom] = useState(1);

  const showGrid = useUIStore((s) => s.showGrid);
  const snapToGrid = useUIStore((s) => s.snapToGrid);

  const activeFormationId = useFormationStore((s) => s.activeFormationId);
  const positions = useFormationStore((s) => s.positions);
  const updateLocalPosition = useFormationStore((s) => s.updateLocalPosition);

  const storedPositions = activeFormationId ? positions[activeFormationId] ?? [] : [];
  const isPlayback = playbackPositions != null && playbackPositions.length > 0;
  const activePositions = isPlayback ? playbackPositions : storedPositions;

  // ResizeObserver — NEVER hardcode dimensions
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const ro = new ResizeObserver(([entry]) => {
      if (entry) {
        setContainerSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Compute scale to fit stage in container with padding
  const padding = 40;
  const availW = Math.max(containerSize.width - padding * 2, 100);
  const availH = Math.max(containerSize.height - padding * 2, 100);
  const baseScale = Math.min(availW / piece.stage_width, availH / piece.stage_depth);
  const scale = baseScale * zoom;

  // Center the stage in the container
  const stagePixelW = piece.stage_width * scale;
  const stagePixelH = piece.stage_depth * scale;
  const offsetX = (containerSize.width - stagePixelW) / 2;
  const offsetY = (containerSize.height - stagePixelH) / 2;

  // Wheel zoom
  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();
      const delta = e.evt.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
      setZoom((z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z + delta)));
    },
    []
  );

  // Drag callbacks
  const handleDragMove = useCallback(
    (id: string, x: number, y: number) => {
      if (!activeFormationId) return;
      updateLocalPosition(activeFormationId, id, x, y);
    },
    [activeFormationId, updateLocalPosition]
  );

  const handleDragEnd = useCallback(
    (id: string, x: number, y: number) => {
      if (!activeFormationId) return;
      updateLocalPosition(activeFormationId, id, x, y);
    },
    [activeFormationId, updateLocalPosition]
  );

  return (
    <div
      ref={containerRef}
      className="w-full h-full min-h-[400px] bg-slate-900 rounded-xl overflow-hidden border border-slate-700 relative"
    >
      <Stage
        ref={stageRef}
        width={containerSize.width}
        height={containerSize.height}
        onWheel={handleWheel}
      >
        {/* Background + stage floor */}
        <Layer listening={false}>
          {/* Full background */}
          <Rect
            x={0}
            y={0}
            width={containerSize.width}
            height={containerSize.height}
            fill={STAGE_BG}
            listening={false}
          />
        </Layer>

        {/* Stage content group — offset to center, scaled */}
        <Layer
          x={offsetX}
          y={offsetY}
          scaleX={scale}
          scaleY={scale}
        >
          {/* Stage floor */}
          <Rect
            x={0}
            y={0}
            width={piece.stage_width}
            height={piece.stage_depth}
            fill="#1a1f2e"
            stroke={STAGE_BORDER}
            strokeWidth={0.1}
            cornerRadius={0.3}
            listening={false}
          />

          {/* Audience label (bottom of stage = downstage) */}
          <Text
            x={piece.stage_width / 2}
            y={piece.stage_depth + 0.5}
            text="AUDIENCE"
            fontSize={0.6}
            fill={LABEL_COLOR}
            fontFamily="Inter, system-ui, sans-serif"
            fontStyle="600"
            letterSpacing={0.15}
            align="center"
            offsetX={2}
            listening={false}
          />

          {/* Center mark */}
          <Line
            points={[piece.stage_width / 2 - 0.3, piece.stage_depth / 2, piece.stage_width / 2 + 0.3, piece.stage_depth / 2]}
            stroke="rgba(148, 163, 184, 0.15)"
            strokeWidth={0.04}
            listening={false}
          />
          <Line
            points={[piece.stage_width / 2, piece.stage_depth / 2 - 0.3, piece.stage_width / 2, piece.stage_depth / 2 + 0.3]}
            stroke="rgba(148, 163, 184, 0.15)"
            strokeWidth={0.04}
            listening={false}
          />
        </Layer>

        {/* Grid + Dancers layer */}
        <Layer x={offsetX} y={offsetY} scaleX={scale} scaleY={scale}>
          <GridLayer
            stageWidth={piece.stage_width}
            stageDepth={piece.stage_depth}
            visible={showGrid}
          />
          <DancerLayer
            positions={activePositions}
            snapToGrid={snapToGrid}
            interactive={!isPlayback}
            onDragMove={handleDragMove}
            onDragEnd={handleDragEnd}
          />
        </Layer>
      </Stage>

      {/* Zoom indicator */}
      <div className="absolute bottom-3 right-3 bg-slate-800/80 backdrop-blur-sm rounded-lg px-2.5 py-1 text-xs text-slate-400 font-mono">
        {Math.round(zoom * 100)}%
      </div>
    </div>
  );
}
