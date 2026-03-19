import { useRef, useState, useEffect, useCallback } from 'react';
import { Stage, Layer, Rect, Line, Text } from 'react-konva';
import type Konva from 'konva';
import { GridLayer } from './GridLayer';
import { DancerLayer } from './DancerLayer';
import { PathLayer } from './PathLayer';
import { useUIStore } from '@/stores/uiStore';
import { useFormationStore } from '@/stores/formationStore';
import { usePathStore } from '@/stores/pathStore';
import { simplifyPath } from '@/lib/pathUtils';
import type { Piece, PlaybackPosition, DancerPath } from '@/types';

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
  const canvasMode = useUIStore((s) => s.canvasMode);

  const formations = useFormationStore((s) => s.formations);
  const activeFormationId = useFormationStore((s) => s.activeFormationId);
  const allPositions = useFormationStore((s) => s.positions);
  const updateLocalPosition = useFormationStore((s) => s.updateLocalPosition);

  const paths = usePathStore((s) => s.paths);
  const drawingPoints = usePathStore((s) => s.drawingPoints);
  const drawingDancerLabel = usePathStore((s) => s.drawingDancerLabel);
  const selectedPath = usePathStore((s) => s.selectedPath);
  const isDrawing = usePathStore((s) => s.isDrawing);
  const addDrawingPoint = usePathStore((s) => s.addDrawingPoint);
  const finishDrawing = usePathStore((s) => s.finishDrawing);
  const cancelDrawing = usePathStore((s) => s.cancelDrawing);
  const stopEditing = usePathStore((s) => s.stopEditing);
  const selectPath = usePathStore((s) => s.selectPath);
  const savePath = usePathStore((s) => s.savePath);

  const storedPositions = activeFormationId ? allPositions[activeFormationId] ?? [] : [];
  const isPlayback = playbackPositions != null && playbackPositions.length > 0;
  const activePositions = isPlayback ? playbackPositions : storedPositions;

  // Next formation's positions (for path end points)
  const activeIdx = formations.findIndex((f) => f.id === activeFormationId);
  const nextFormation = activeIdx >= 0 && activeIdx + 1 < formations.length ? formations[activeIdx + 1] : null;
  const nextPositions = nextFormation ? allPositions[nextFormation.id] ?? [] : [];
  const activePaths: DancerPath[] = activeFormationId ? paths[activeFormationId] ?? [] : [];

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

  // Path drawing: convert pixel coords to stage coords
  const pixelToStage = useCallback(
    (pixelX: number, pixelY: number) => ({
      x: (pixelX - offsetX) / scale,
      y: (pixelY - offsetY) / scale,
    }),
    [offsetX, offsetY, scale]
  );

  // Freehand: mouse move adds points while drawing
  const handleStageMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
      if (!isDrawing || canvasMode !== 'draw-freehand') return;
      const stage = e.target.getStage();
      if (!stage) return;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;
      const pt = pixelToStage(pointer.x, pointer.y);
      addDrawingPoint(pt.x, pt.y);
    },
    [isDrawing, canvasMode, pixelToStage, addDrawingPoint]
  );

  // Freehand: mouse up finishes drawing
  const handleStageMouseUp = useCallback(() => {
    if (!isDrawing || canvasMode !== 'draw-freehand' || !activeFormationId) return;
    // Simplify the path before saving
    const simplified = simplifyPath(drawingPoints, 0.3);
    if (simplified.length > 0 && drawingDancerLabel) {
      savePath(activeFormationId, drawingDancerLabel, simplified, 'freehand');
    }
    cancelDrawing();
  }, [isDrawing, canvasMode, activeFormationId, drawingPoints, drawingDancerLabel, savePath, cancelDrawing]);

  // Geometric: click on stage adds a waypoint
  const handleStageClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
      if (canvasMode === 'select') {
        // Deselect path if clicking on empty space
        if (e.target === e.target.getStage() || e.target.getClassName() === 'Rect') {
          stopEditing();
        }
        return;
      }
      if (canvasMode !== 'draw-geometric' || !isDrawing) return;
      const stage = e.target.getStage();
      if (!stage) return;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;
      const pt = pixelToStage(pointer.x, pointer.y);
      addDrawingPoint(pt.x, pt.y);
    },
    [canvasMode, isDrawing, pixelToStage, addDrawingPoint, stopEditing]
  );

  // Geometric: double-click finishes drawing
  const handleStageDblClick = useCallback(() => {
    if (canvasMode !== 'draw-geometric' || !isDrawing || !activeFormationId) return;
    finishDrawing(activeFormationId, 'geometric');
  }, [canvasMode, isDrawing, activeFormationId, finishDrawing]);

  // Escape key cancels drawing
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isDrawing) {
        cancelDrawing();
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedPath && activeFormationId) {
          usePathStore.getState().removePath(activeFormationId, selectedPath.dancerLabel);
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawing, cancelDrawing, selectedPath, activeFormationId]);

  // Control point drag handler
  const handleControlPointDrag = useCallback(
    (dancerLabel: string, pointIndex: number, x: number, y: number) => {
      if (!activeFormationId) return;
      const currentPaths = usePathStore.getState().paths[activeFormationId] ?? [];
      const path = currentPaths.find((p) => p.dancer_label === dancerLabel);
      if (!path) return;
      const newPoints = [...path.path_points];
      newPoints[pointIndex] = { x, y };
      savePath(activeFormationId, dancerLabel, newPoints, path.path_type);
    },
    [activeFormationId, savePath]
  );

  // Path click handler
  const handlePathClick = useCallback(
    (dancerLabel: string) => {
      if (!activeFormationId || canvasMode !== 'select') return;
      selectPath(activeFormationId, dancerLabel);
    },
    [activeFormationId, canvasMode, selectPath]
  );

  return (
    <div
      ref={containerRef}
      className="w-full h-full min-h-[400px] bg-surface rounded-xl overflow-hidden border border-border relative"
    >
      <Stage
        ref={stageRef}
        width={containerSize.width}
        height={containerSize.height}
        onWheel={handleWheel}
        onMouseMove={handleStageMouseMove}
        onTouchMove={handleStageMouseMove}
        onMouseUp={handleStageMouseUp}
        onTouchEnd={handleStageMouseUp}
        onClick={handleStageClick}
        onTap={handleStageClick}
        onDblClick={handleStageDblClick}
        onDblTap={handleStageDblClick}
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

        {/* Grid + Paths + Dancers layer */}
        <Layer x={offsetX} y={offsetY} scaleX={scale} scaleY={scale}>
          <GridLayer
            stageWidth={piece.stage_width}
            stageDepth={piece.stage_depth}
            visible={showGrid}
          />
          {!isPlayback && nextPositions.length > 0 && (
            <PathLayer
              paths={activePaths}
              positions={storedPositions}
              nextPositions={nextPositions}
              drawingPoints={drawingPoints}
              drawingDancerLabel={drawingDancerLabel}
              selectedPath={selectedPath}
              canvasMode={canvasMode}
              onControlPointDrag={handleControlPointDrag}
              onPathClick={handlePathClick}
            />
          )}
          <DancerLayer
            positions={activePositions}
            snapToGrid={snapToGrid}
            interactive={!isPlayback && canvasMode === 'select'}
            canvasMode={canvasMode}
            onDragMove={handleDragMove}
            onDragEnd={handleDragEnd}
          />
        </Layer>
      </Stage>

      {/* Zoom indicator */}
      <div className="absolute bottom-3 right-3 bg-surface-elevated/80 backdrop-blur-sm rounded-lg px-2.5 py-1 text-xs text-text-secondary font-mono">
        {Math.round(zoom * 100)}%
      </div>
    </div>
  );
}
