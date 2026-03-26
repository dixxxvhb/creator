import React, { useRef, useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Stage, Layer, Rect, Line, Text, Circle, Group } from 'react-konva';
import type Konva from 'konva';
import { GridLayer } from './GridLayer';
import { DancerLayer } from './DancerLayer';
import { PathLayer } from './PathLayer';
import { OffstageGhostLayer } from './OffstageGhostLayer';
import { useUIStore } from '@/stores/uiStore';
import { useFormationStore } from '@/stores/formationStore';
import { usePathStore } from '@/stores/pathStore';
import { simplifyPath } from '@/lib/pathUtils';
import { useRosterStore } from '@/stores/rosterStore';
import type { Piece, PlaybackPosition, DancerPath } from '@/types';

interface FormationCanvasProps {
  piece: Piece;
  playbackPositions?: PlaybackPosition[] | null;
  onZoomChange?: (zoom: number) => void;
}

export interface FormationCanvasHandle {
  toDataURL: (pixelRatio?: number) => string | null;
  zoomIn: () => void;
  zoomOut: () => void;
  zoomReset: () => void;
  getZoom: () => number;
  setZoom: (z: number) => void;
}

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3.0;
const ZOOM_STEP = 0.1;

// Stage border/label colors
const STAGE_BG = '#141824';
const STAGE_BORDER = '#334155';
const LABEL_COLOR = '#64748b';

export const FormationCanvas = forwardRef<FormationCanvasHandle, FormationCanvasProps>(function FormationCanvas({ piece, playbackPositions, onZoomChange }, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);

  useImperativeHandle(ref, () => ({
    toDataURL: (pixelRatio = 2) => {
      if (!stageRef.current) return null;
      return stageRef.current.toDataURL({ pixelRatio });
    },
    zoomIn: () => setZoom((z) => {
      const next = Math.min(MAX_ZOOM, z + ZOOM_STEP);
      onZoomChange?.(next);
      return next;
    }),
    zoomOut: () => setZoom((z) => {
      const next = Math.max(MIN_ZOOM, z - ZOOM_STEP);
      onZoomChange?.(next);
      return next;
    }),
    zoomReset: () => {
      setZoom(1);
      setPanX(0);
      setPanY(0);
      onZoomChange?.(1);
    },
    getZoom: () => zoom,
    setZoom: (z: number) => {
      setZoom(z);
      onZoomChange?.(z);
    },
  }));

  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  const showGrid = useUIStore((s) => s.showGrid);
  const snapToGrid = useUIStore((s) => s.snapToGrid);
  const showStageNumbers = useUIStore((s) => s.showStageNumbers);
  const canvasMode = useUIStore((s) => s.canvasMode);
  const audiencePosition = useUIStore((s) => s.audiencePosition);
  const clearDancerSelection = useUIStore((s) => s.clearDancerSelection);

  const formations = useFormationStore((s) => s.formations);
  const activeFormationId = useFormationStore((s) => s.activeFormationId);
  const allPositions = useFormationStore((s) => s.positions);
  const updateLocalPosition = useFormationStore((s) => s.updateLocalPosition);

  const rosterDancers = useRosterStore((s) => s.dancers);
  const paths = usePathStore((s) => s.paths);
  const drawingPoints = usePathStore((s) => s.drawingPoints);
  const drawingDancerLabel = usePathStore((s) => s.drawingDancerLabel);
  const selectedPath = usePathStore((s) => s.selectedPath);
  const isDrawing = usePathStore((s) => s.isDrawing);
  const isDragDrawing = usePathStore((s) => s.isDragDrawing);
  const addDrawingPoint = usePathStore((s) => s.addDrawingPoint);
  const cancelDrawing = usePathStore((s) => s.cancelDrawing);
  const stopEditing = usePathStore((s) => s.stopEditing);
  const selectPath = usePathStore((s) => s.selectPath);
  const savePath = usePathStore((s) => s.savePath);

  const storedPositions = activeFormationId ? allPositions[activeFormationId] ?? [] : [];
  const isPlayback = playbackPositions != null && playbackPositions.length > 0;
  const activePositions = isPlayback ? playbackPositions : storedPositions;

  // Adjacent formation positions
  const activeIdx = formations.findIndex((f) => f.id === activeFormationId);
  const nextFormation = activeIdx >= 0 && activeIdx + 1 < formations.length ? formations[activeIdx + 1] : null;
  const nextPositions = nextFormation ? allPositions[nextFormation.id] ?? [] : [];
  const prevFormation = activeIdx > 0 ? formations[activeIdx - 1] : null;
  const prevPositions = prevFormation ? allPositions[prevFormation.id] ?? [] : [];
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
  // Less padding on smaller screens to maximize stage area
  const padding = Math.min(containerSize.width, containerSize.height) < 500 ? 20 : 40;
  const availW = Math.max(containerSize.width - padding * 2, 100);
  const availH = Math.max(containerSize.height - padding * 2, 100);
  const baseScale = Math.min(availW / piece.stage_width, availH / piece.stage_depth);
  const scale = baseScale * zoom;

  // Center the stage in the container
  const stagePixelW = piece.stage_width * scale;
  const stagePixelH = piece.stage_depth * scale;
  const offsetX = (containerSize.width - stagePixelW) / 2 + panX;
  const offsetY = (containerSize.height - stagePixelH) / 2 + panY;

  // Wheel: Ctrl/Cmd+wheel = zoom, plain wheel/trackpad scroll = pan
  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      const evt = e.evt;
      if (evt.ctrlKey || evt.metaKey) {
        // Zoom (existing behavior)
        evt.preventDefault();
        const delta = evt.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
        setZoom((z) => {
          const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z + delta));
          onZoomChange?.(next);
          return next;
        });
      } else {
        // Pan via scroll/trackpad two-finger swipe
        evt.preventDefault();
        setPanX((px) => px - evt.deltaX);
        setPanY((py) => py - evt.deltaY);
      }
    },
    [onZoomChange]
  );

  // Middle-mouse-button drag to pan
  const handleMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (e.evt.button === 1) {
        // Middle mouse button
        e.evt.preventDefault();
        isPanningRef.current = true;
        panStartRef.current = { x: e.evt.clientX, y: e.evt.clientY, panX, panY };
      }
    },
    [panX, panY]
  );

  const handleMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (!isPanningRef.current) return;
      const dx = e.evt.clientX - panStartRef.current.x;
      const dy = e.evt.clientY - panStartRef.current.y;
      setPanX(panStartRef.current.panX + dx);
      setPanY(panStartRef.current.panY + dy);
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

  // Combined mouse move: panning + freehand drawing
  const handleStageMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
      // Middle-button pan
      if (isPanningRef.current && 'clientX' in e.evt) {
        handleMouseMove(e as Konva.KonvaEventObject<MouseEvent>);
        return;
      }
      // Freehand drawing
      if (!isDrawing || isDragDrawing || canvasMode !== 'draw-freehand') return;
      const stage = e.target.getStage();
      if (!stage) return;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;
      const pt = pixelToStage(pointer.x, pointer.y);
      addDrawingPoint(pt.x, pt.y);
    },
    [isDrawing, isDragDrawing, canvasMode, pixelToStage, addDrawingPoint, handleMouseMove]
  );

  const setCanvasMode = useUIStore((s) => s.setCanvasMode);

  // Mouse up: stop panning + finish freehand drawing
  const handleStageMouseUp = useCallback((_e?: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    // Stop middle-button pan
    if (isPanningRef.current) {
      isPanningRef.current = false;
      return;
    }
    // Freehand drawing finish
    if (!isDrawing || isDragDrawing || canvasMode !== 'draw-freehand' || !activeFormationId) return;
    const simplified = simplifyPath(drawingPoints, 0.3);
    if (simplified.length >= 2 && drawingDancerLabel) {
      savePath(activeFormationId, drawingDancerLabel, simplified, 'freehand');
      setCanvasMode('select');
    }
    cancelDrawing();
  }, [isDrawing, isDragDrawing, canvasMode, activeFormationId, drawingPoints, drawingDancerLabel, savePath, cancelDrawing, setCanvasMode]);

  // Click on stage — deselect path and clear dancer selection when in select mode
  const handleStageClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
      if (canvasMode === 'select') {
        if (e.target === e.target.getStage() || e.target.getClassName() === 'Rect') {
          stopEditing();
          clearDancerSelection();
        }
      }
    },
    [canvasMode, stopEditing, clearDancerSelection]
  );

  // Keyboard shortcuts for drawing
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
      // Ctrl+Z / Cmd+Z to undo path actions
      if (e.key === 'z' && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
        e.preventDefault();
        usePathStore.getState().undo();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawing, cancelDrawing, selectedPath, activeFormationId]);

  // Clear dancer selection when formation changes
  useEffect(() => {
    clearDancerSelection();
  }, [activeFormationId, clearDancerSelection]);

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

  // Ghost drag-on handler — when an offstage ghost is dragged onto the stage
  const handleGhostDragOnstage = useCallback(
    (dancerLabel: string, x: number, y: number) => {
      if (!activeFormationId) return;
      // Find the position in current formation by label
      const pos = storedPositions.find((p) => p.dancer_label === dancerLabel);
      if (pos) {
        updateLocalPosition(activeFormationId, pos.id, x, y);
      }
    },
    [activeFormationId, storedPositions, updateLocalPosition]
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
      className="w-full h-full min-h-[250px] bg-surface rounded-xl overflow-hidden border border-border relative"
      onContextMenu={(e) => { if (e.button === 1) e.preventDefault(); }}
    >
      <Stage
        ref={stageRef}
        width={containerSize.width}
        height={containerSize.height}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleStageMouseMove}
        onTouchMove={handleStageMouseMove}
        onMouseUp={handleStageMouseUp}
        onTouchEnd={handleStageMouseUp}
        onClick={handleStageClick}
        onTap={handleStageClick}
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
            strokeWidth={2.5}
            cornerRadius={8}
            listening={false}
          />

          {/* Audience label */}
          <Text
            x={piece.stage_width / 2}
            y={audiencePosition === 'top' ? -55 : piece.stage_depth + 35}
            text="AUDIENCE"
            fontSize={12}
            fill={LABEL_COLOR}
            fontFamily="Inter, system-ui, sans-serif"
            fontStyle="600"
            letterSpacing={4}
            align="center"
            width={200}
            offsetX={100}
            listening={false}
          />

          {/* Center mark */}
          <Line
            points={[piece.stage_width / 2 - 8, piece.stage_depth / 2, piece.stage_width / 2 + 8, piece.stage_depth / 2]}
            stroke="rgba(148, 163, 184, 0.15)"
            strokeWidth={1}
            listening={false}
          />
          <Line
            points={[piece.stage_width / 2, piece.stage_depth / 2 - 8, piece.stage_width / 2, piece.stage_depth / 2 + 8]}
            stroke="rgba(148, 163, 184, 0.15)"
            strokeWidth={1}
            listening={false}
          />

          {/* Stage position numbers (0, 2, 4, 6, 8... from center out) */}
          {showStageNumbers && (() => {
            const cx = piece.stage_width / 2;
            const tickY1 = audiencePosition === 'top' ? 0 : piece.stage_depth;
            const tickY2 = audiencePosition === 'top' ? -18 : piece.stage_depth + 18;
            const labelY = audiencePosition === 'top' ? -32 : piece.stage_depth + 18;
            // Each mark is 125 stage units apart, labeled 0, 2, 4, 6, 8...
            const spacing = 125;
            const maxMarks = Math.floor((piece.stage_width / 2) / spacing);
            const markers: { x: number; label: string }[] = [{ x: cx, label: '0' }];
            for (let i = 1; i <= maxMarks; i++) {
              const num = i * 2;
              markers.push({ x: cx + i * spacing, label: String(num) });
              markers.push({ x: cx - i * spacing, label: String(num) });
            }
            return markers.map((m, i) => (
              <React.Fragment key={`sn-${i}`}>
                <Line
                  points={[m.x, tickY1, m.x, tickY2]}
                  stroke="rgba(148, 163, 184, 0.35)"
                  strokeWidth={1.5}
                  listening={false}
                />
                <Text
                  x={m.x}
                  y={labelY}
                  text={m.label}
                  fontSize={20}
                  fill="rgba(148, 163, 184, 0.6)"
                  fontFamily="Inter, system-ui, sans-serif"
                  fontStyle="bold"
                  align="center"
                  offsetX={m.label.length * 5}
                  listening={false}
                />
              </React.Fragment>
            ));
          })()}
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
              isDrawing={isDrawing}
              onControlPointDrag={handleControlPointDrag}
              onPathClick={handlePathClick}
            />
          )}
          <DancerLayer
            positions={activePositions}
            snapToGrid={snapToGrid}
            interactive={!isPlayback}
            canvasMode={canvasMode}
            rosterDancers={rosterDancers}
            drawingDancerLabel={drawingDancerLabel}
            isDrawing={isDrawing}
            hasNextFormation={nextPositions.length > 0}
            focalDancerId={piece.focal_dancer_id}
            stageWidth={piece.stage_width}
            stageDepth={piece.stage_depth}
            activeFormationId={activeFormationId ?? undefined}
            onDragMove={handleDragMove}
            onDragEnd={handleDragEnd}
          />
          {/* Draw target indicators — show where dancers go in next formation */}
          {!isPlayback && (canvasMode === 'draw-freehand') && nextPositions.length > 0 && (
            <Group listening={false}>
              {nextPositions.map((np) => {
                const current = storedPositions.find((p) => p.dancer_label === np.dancer_label);
                if (!current) return null;
                // Skip if dancer hasn't moved
                if (Math.abs(current.x - np.x) < 8 && Math.abs(current.y - np.y) < 8) return null;
                const isTarget = drawingDancerLabel === np.dancer_label;
                return (
                  <Group key={np.id} x={np.x} y={np.y} opacity={isTarget ? 0.9 : 0.35}>
                    {/* Pulsing target ring */}
                    <Circle
                      radius={30}
                      stroke={np.color}
                      strokeWidth={isTarget ? 3 : 2}
                      dash={[5, 4]}
                    />
                    {/* Crosshair lines */}
                    <Line points={[-12, 0, 12, 0]} stroke={np.color} strokeWidth={1.5} />
                    <Line points={[0, -12, 0, 12]} stroke={np.color} strokeWidth={1.5} />
                    {/* Label */}
                    <Text
                      text={np.dancer_label}
                      fontSize={12}
                      fill={np.color}
                      fontStyle="bold"
                      fontFamily="Inter, system-ui, sans-serif"
                      align="center"
                      width={75}
                      offsetX={37.5}
                      y={35}
                    />
                  </Group>
                );
              })}
            </Group>
          )}
          {/* Ghost reminders for offstage dancers from previous formation */}
          {!isPlayback && prevPositions.length > 0 && (
            <OffstageGhostLayer
              previousPositions={prevPositions}
              currentPositions={storedPositions}
              stageWidth={piece.stage_width}
              stageDepth={piece.stage_depth}
              onDragOnstage={handleGhostDragOnstage}
            />
          )}
        </Layer>
      </Stage>

      {/* Drawing status banner */}
      {canvasMode === 'draw-freehand' && !isPlayback && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2">
          <div className="bg-black/75 backdrop-blur-sm rounded-lg px-4 py-2 text-xs text-white text-center whitespace-nowrap">
            {!isDrawing ? (
              'Grab a dancer and drag to draw their path'
            ) : (
              <>Drawing <strong>{drawingDancerLabel}</strong> — release to finish</>
            )}
            <span className="text-white/50 ml-2">Esc to cancel</span>
          </div>
        </div>
      )}

      {/* Zoom indicator */}
      <div className="absolute bottom-3 right-3 bg-surface-elevated/80 backdrop-blur-sm rounded-lg px-2.5 py-1 text-xs text-text-secondary font-mono">
        {Math.round(zoom * 100)}%
      </div>
    </div>
  );
});
