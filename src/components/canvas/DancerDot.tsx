import { useRef } from 'react';
import { Group, Circle, Text } from 'react-konva';
import type Konva from 'konva';
import type { DancerPosition, CanvasMode } from '@/types';
import { usePathStore } from '@/stores/pathStore';

interface DancerDotProps {
  position: DancerPosition;
  snapToGrid: boolean;
  interactive?: boolean;
  canvasMode?: CanvasMode;
  opacity?: number;
  onDragMove: (id: string, x: number, y: number) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
}

const DOT_RADIUS = 0.8;
const FONT_SIZE = 0.7;

export function DancerDot({ position, snapToGrid, interactive = true, canvasMode = 'select', opacity = 1, onDragMove, onDragEnd }: DancerDotProps) {
  const groupRef = useRef<Konva.Group>(null);
  const isDrawMode = canvasMode === 'draw-freehand' || canvasMode === 'draw-geometric';

  function handleDragMove() {
    const node = groupRef.current;
    if (!node) return;
    const x = node.x();
    const y = node.y();
    onDragMove(position.id, x, y);
  }

  function handleDragEnd() {
    const node = groupRef.current;
    if (!node) return;
    let x = node.x();
    let y = node.y();
    if (snapToGrid) {
      x = Math.round(x);
      y = Math.round(y);
      node.position({ x, y });
    }
    onDragEnd(position.id, x, y);
  }

  // Handle click in draw mode — starts path drawing from this dancer
  function handleDrawClick() {
    if (!isDrawMode) return;
    usePathStore.getState().startDrawing(position.dancer_label);
  }

  const fontSize = FONT_SIZE;
  const label = position.dancer_label || '?';
  const isDraggable = interactive && !isDrawMode;

  return (
    <Group
      ref={groupRef}
      x={position.x}
      y={position.y}
      opacity={opacity}
      draggable={isDraggable}
      onDragMove={isDraggable ? handleDragMove : undefined}
      onDragEnd={isDraggable ? handleDragEnd : undefined}
      onClick={isDrawMode ? handleDrawClick : undefined}
      onTap={isDrawMode ? handleDrawClick : undefined}
    >
      {/* Draw-mode ring indicator */}
      {isDrawMode && (
        <Circle
          radius={DOT_RADIUS + 0.2}
          stroke={position.color}
          strokeWidth={0.08}
          opacity={0.6}
          dash={[0.15, 0.1]}
          listening={false}
        />
      )}
      {/* Shadow for depth */}
      <Circle
        radius={DOT_RADIUS}
        fill="rgba(0,0,0,0.3)"
        offsetX={-0.05}
        offsetY={-0.05}
      />
      {/* Main dot */}
      <Circle
        radius={DOT_RADIUS}
        fill={position.color}
        stroke="rgba(255,255,255,0.3)"
        strokeWidth={0.06}
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
    </Group>
  );
}
