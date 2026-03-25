import { useRef } from 'react';
import { Group, Circle, Text, Line, Star as KonvaStar } from 'react-konva';
import type Konva from 'konva';
import type { DancerPosition, CanvasMode } from '@/types';
import { usePathStore } from '@/stores/pathStore';
import { useUIStore } from '@/stores/uiStore';
import { isOffstage, getOffstageDirection, clampToEdge } from '@/lib/offstage';
import { simplifyPath } from '@/lib/pathUtils';
import { toast } from '@/stores/toastStore';

interface DancerDotProps {
  position: DancerPosition;
  snapToGrid: boolean;
  interactive?: boolean;
  canvasMode?: CanvasMode;
  opacity?: number;
  displayName?: string | null;
  /** Whether this dancer is the active drawing target */
  isDrawingTarget?: boolean;
  /** Whether any drawing is currently in progress */
  isDrawing?: boolean;
  /** Whether this formation has a next formation (for path drawing) */
  hasNextFormation?: boolean;
  /** Stage dimensions for offstage detection */
  stageWidth?: number;
  stageDepth?: number;
  /** Whether this dancer is the focal/lead dancer */
  isFocal?: boolean;
  /** Active formation ID for saving drawn paths */
  activeFormationId?: string;
  onDragMove: (id: string, x: number, y: number) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
}

const DOT_RADIUS = 22;
const FONT_SIZE = 18;

// Arrow points for each exit direction (relative to dot center)
const ARROW_POINTS: Record<string, number[]> = {
  left:  [-DOT_RADIUS - 8, 0, -DOT_RADIUS - 22, 0],
  right: [DOT_RADIUS + 8, 0, DOT_RADIUS + 22, 0],
  back:  [0, -DOT_RADIUS - 8, 0, -DOT_RADIUS - 22],
  front: [0, DOT_RADIUS + 8, 0, DOT_RADIUS + 22],
};

export function DancerDot({
  position,
  snapToGrid,
  interactive = true,
  canvasMode = 'select',
  opacity = 1,
  displayName,
  isDrawingTarget = false,
  isDrawing = false,
  hasNextFormation = false,
  isFocal = false,
  stageWidth,
  stageDepth,
  activeFormationId,
  onDragMove,
  onDragEnd,
}: DancerDotProps) {
  const groupRef = useRef<Konva.Group>(null);
  const originalPosRef = useRef<{ x: number; y: number } | null>(null);
  const isDrawMode = canvasMode === 'draw-freehand' || canvasMode === 'draw-geometric';

  // Offstage detection
  const offstage = stageWidth != null && stageDepth != null
    ? isOffstage(position.x, position.y, stageWidth, stageDepth)
    : false;
  const offstageDir = offstage && stageWidth != null && stageDepth != null
    ? getOffstageDirection(position.x, position.y, stageWidth, stageDepth)
    : null;
  const renderPos = offstage && stageWidth != null && stageDepth != null
    ? clampToEdge(position.x, position.y, stageWidth, stageDepth)
    : { x: position.x, y: position.y };

  // Can this dot be grabbed for path drawing?
  const canDrawDrag = isDrawMode && !isDrawing && hasNextFormation && interactive;
  // Keep dot draggable while it's the active drawing target (mid-drag)
  const isActiveDrawDrag = isDrawMode && isDrawing && isDrawingTarget && interactive;

  function handleDragStart() {
    if (!canDrawDrag) return;
    // Store original position so we can snap back after drawing
    originalPosRef.current = { x: renderPos.x, y: renderPos.y };
    usePathStore.getState().startDrawing(position.dancer_label, true);
    usePathStore.getState().addDrawingPoint(position.x, position.y);
  }

  function handleDragMove() {
    const node = groupRef.current;
    if (!node) return;
    const x = node.x();
    const y = node.y();

    if (originalPosRef.current) {
      // Drawing mode — add trail point
      usePathStore.getState().addDrawingPoint(x, y);
    } else {
      // Select mode — move dancer position
      onDragMove(position.id, x, y);
    }
  }

  function handleDragEnd() {
    const node = groupRef.current;
    if (!node) return;

    if (originalPosRef.current) {
      // Drawing mode — save path and snap circle back
      const orig = originalPosRef.current;
      originalPosRef.current = null;
      node.position({ x: orig.x, y: orig.y });

      // Save the drawn path
      if (activeFormationId) {
        const pathStore = usePathStore.getState();
        const simplified = simplifyPath(pathStore.drawingPoints, 7.5);
        if (simplified.length >= 2 && pathStore.drawingDancerLabel) {
          pathStore.savePath(activeFormationId, pathStore.drawingDancerLabel, simplified, 'freehand');
        }
        pathStore.cancelDrawing();
        useUIStore.getState().setCanvasMode('select');
      } else {
        usePathStore.getState().cancelDrawing();
      }
    } else {
      // Select mode — normal drag end with snap
      let x = node.x();
      let y = node.y();
      if (snapToGrid && stageWidth != null && stageDepth != null && !isOffstage(x, y, stageWidth, stageDepth)) {
        const SNAP_UNIT = 31.25;
        x = Math.round(x / SNAP_UNIT) * SNAP_UNIT;
        y = Math.round(y / SNAP_UNIT) * SNAP_UNIT;
        node.position({ x, y });
      }
      onDragEnd(position.id, x, y);
    }
  }

  // Click handler for draw mode — show toast on last formation
  function handleDrawClick(e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) {
    e.cancelBubble = true;
    if (isDrawing) return;

    if (!hasNextFormation) {
      toast.info('This is the last formation — go to a previous formation to draw paths.');
      return;
    }

    // In select mode, clicking a dancer enters draw mode
    if (canvasMode === 'select') {
      useUIStore.getState().setCanvasMode('draw-freehand');
      toast.info('Now drag the dancer to draw their path.');
    }
  }

  const fontSize = FONT_SIZE;
  const label = displayName ? displayName.charAt(0).toUpperCase() : (position.dancer_label || '?');
  const isDraggable = interactive && (!isDrawMode || canDrawDrag || isActiveDrawDrag);

  // Ring display logic
  const showTargetRing = isDrawingTarget;
  const showClickableRing = isDrawMode && !isDrawing;
  const dimmed = isDrawMode && isDrawing && !isDrawingTarget;

  // Offstage visual style
  const effectiveOpacity = offstage
    ? (dimmed ? 0.15 : 0.4)
    : (dimmed ? opacity * 0.4 : opacity);

  return (
    <Group
      ref={groupRef}
      x={renderPos.x}
      y={renderPos.y}
      opacity={effectiveOpacity}
      draggable={isDraggable}
      onDragStart={canDrawDrag ? handleDragStart : undefined}
      onDragMove={isDraggable ? handleDragMove : undefined}
      onDragEnd={isDraggable ? handleDragEnd : undefined}
      onClick={handleDrawClick}
      onTap={handleDrawClick}
    >
      {/* Active drawing target — bright glow ring */}
      {showTargetRing && (
        <Circle
          radius={DOT_RADIUS + 9}
          stroke={position.color}
          strokeWidth={3}
          opacity={0.9}
          listening={false}
        />
      )}
      {showTargetRing && (
        <Circle
          radius={DOT_RADIUS + 12}
          stroke={position.color}
          strokeWidth={1.5}
          opacity={0.4}
          listening={false}
        />
      )}
      {/* Clickable hint — dashed ring on all dancers before drawing starts */}
      {showClickableRing && (
        <Circle
          radius={DOT_RADIUS + 5}
          stroke={position.color}
          strokeWidth={2}
          opacity={0.6}
          dash={[4, 2.5]}
          listening={false}
        />
      )}
      {/* Offstage dashed ring */}
      {offstage && (
        <Circle
          radius={DOT_RADIUS + 4}
          stroke={position.color}
          strokeWidth={2}
          dash={[5, 3]}
          listening={false}
        />
      )}
      {/* Shadow for depth */}
      <Circle
        radius={DOT_RADIUS}
        fill="rgba(0,0,0,0.3)"
        offsetX={-1.25}
        offsetY={-1.25}
      />
      {/* Main dot */}
      <Circle
        radius={DOT_RADIUS}
        fill={offstage ? 'transparent' : position.color}
        stroke={position.color}
        strokeWidth={offstage ? 2.5 : 1.5}
      />
      {/* Label */}
      <Text
        text={label}
        fontSize={fontSize}
        fill="#ffffff"
        fontStyle="bold"
        fontFamily="Inter, system-ui, sans-serif"
        align="center"
        verticalAlign="middle"
        width={DOT_RADIUS * 2}
        height={DOT_RADIUS * 2}
        offsetX={DOT_RADIUS}
        offsetY={DOT_RADIUS}
        listening={false}
      />
      {/* Focal dancer star */}
      {isFocal && (
        <KonvaStar
          x={0}
          y={-DOT_RADIUS - 10}
          numPoints={5}
          innerRadius={3}
          outerRadius={7}
          fill="#F59E0B"
          stroke="#F59E0B"
          strokeWidth={0.5}
          listening={false}
        />
      )}
      {/* Direction arrow for offstage dancers */}
      {offstageDir && ARROW_POINTS[offstageDir] && (
        <Line
          points={ARROW_POINTS[offstageDir]}
          stroke={position.color}
          strokeWidth={2.5}
          lineCap="round"
          lineJoin="round"
          listening={false}
          pointerLength={6}
          pointerWidth={5}
          pointerAtBeginning={false}
        />
      )}
      {/* Dancer name below dot */}
      {displayName && (
        <Text
          text={displayName}
          fontSize={11}
          fill="#cbd5e1"
          fontFamily="Inter, system-ui, sans-serif"
          align="center"
          width={150}
          offsetX={75}
          y={DOT_RADIUS + 5}
          listening={false}
        />
      )}
    </Group>
  );
}
