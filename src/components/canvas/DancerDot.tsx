import { useRef } from 'react';
import { Group, Circle, Text } from 'react-konva';
import type Konva from 'konva';
import type { DancerPosition } from '@/types';

interface DancerDotProps {
  position: DancerPosition;
  snapToGrid: boolean;
  onDragMove: (id: string, x: number, y: number) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
}

const DOT_RADIUS = 0.8;
const FONT_SIZE = 0.7;

export function DancerDot({ position, snapToGrid, onDragMove, onDragEnd }: DancerDotProps) {
  const groupRef = useRef<Konva.Group>(null);

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

  // Scale font size inversely so it stays readable at any zoom
  const fontSize = FONT_SIZE;
  const label = position.dancer_label || '?';

  return (
    <Group
      ref={groupRef}
      x={position.x}
      y={position.y}
      draggable
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
    >
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
