import { useRef } from 'react';
import { Group, Circle, Text, Line } from 'react-konva';
import type Konva from 'konva';
import type { DancerPosition } from '@/types';
import { isOffstage, getOffstageDirection, clampToEdge } from '@/lib/offstage';

interface OffstageGhostLayerProps {
  /** Positions from the previous formation */
  previousPositions: DancerPosition[];
  /** Positions in the current formation */
  currentPositions: DancerPosition[];
  stageWidth: number;
  stageDepth: number;
  /** Called when a ghost is dragged onto the stage */
  onDragOnstage: (dancerLabel: string, x: number, y: number) => void;
}

const GHOST_RADIUS = 0.6;

// Arrow directions
const ARROW_OFFSETS: Record<string, number[]> = {
  left:  [-GHOST_RADIUS - 0.2, 0, -GHOST_RADIUS - 0.6, 0],
  right: [GHOST_RADIUS + 0.2, 0, GHOST_RADIUS + 0.6, 0],
  back:  [0, -GHOST_RADIUS - 0.2, 0, -GHOST_RADIUS - 0.6],
  front: [0, GHOST_RADIUS + 0.2, 0, GHOST_RADIUS + 0.6],
};

function GhostDot({
  position,
  direction,
  stageWidth,
  stageDepth,
  onDragOnstage,
}: {
  position: DancerPosition;
  direction: string;
  stageWidth: number;
  stageDepth: number;
  onDragOnstage: (dancerLabel: string, x: number, y: number) => void;
}) {
  const groupRef = useRef<Konva.Group>(null);
  const clamped = clampToEdge(position.x, position.y, stageWidth, stageDepth);

  function handleDragEnd() {
    const node = groupRef.current;
    if (!node) return;
    const x = node.x();
    const y = node.y();
    // Only fire if dragged onto the stage
    if (!isOffstage(x, y, stageWidth, stageDepth)) {
      onDragOnstage(position.dancer_label, x, y);
    } else {
      // Snap back to edge
      node.position(clamped);
    }
  }

  return (
    <Group
      ref={groupRef}
      x={clamped.x}
      y={clamped.y}
      opacity={0.3}
      draggable
      onDragEnd={handleDragEnd}
    >
      {/* Dashed ring */}
      <Circle
        radius={GHOST_RADIUS + 0.1}
        stroke={position.color}
        strokeWidth={0.06}
        dash={[0.15, 0.1]}
        listening={false}
      />
      {/* Ghost dot — outline only */}
      <Circle
        radius={GHOST_RADIUS}
        fill="transparent"
        stroke={position.color}
        strokeWidth={0.08}
      />
      {/* Label */}
      <Text
        text={position.dancer_label || '?'}
        fontSize={0.5}
        fill="#ffffff"
        fontStyle="bold"
        fontFamily="Inter, system-ui, sans-serif"
        align="center"
        verticalAlign="middle"
        width={GHOST_RADIUS * 2}
        height={GHOST_RADIUS * 2}
        offsetX={GHOST_RADIUS}
        offsetY={GHOST_RADIUS}
        listening={false}
      />
      {/* Direction arrow */}
      {ARROW_OFFSETS[direction] && (
        <Line
          points={ARROW_OFFSETS[direction]}
          stroke={position.color}
          strokeWidth={0.07}
          lineCap="round"
          pointerLength={0.18}
          pointerWidth={0.14}
          pointerAtBeginning={false}
          listening={false}
        />
      )}
      {/* "OFF" label */}
      <Text
        text="OFF"
        fontSize={0.3}
        fill={position.color}
        fontFamily="Inter, system-ui, sans-serif"
        fontStyle="600"
        align="center"
        width={3}
        offsetX={1.5}
        y={GHOST_RADIUS + 0.15}
        listening={false}
      />
    </Group>
  );
}

export function OffstageGhostLayer({
  previousPositions,
  currentPositions,
  stageWidth,
  stageDepth,
  onDragOnstage,
}: OffstageGhostLayerProps) {
  // Find dancers from the previous formation that were offstage
  const ghosts: { position: DancerPosition; direction: string }[] = [];

  for (const prevPos of previousPositions) {
    if (!isOffstage(prevPos.x, prevPos.y, stageWidth, stageDepth)) continue;

    const dir = getOffstageDirection(prevPos.x, prevPos.y, stageWidth, stageDepth);
    if (!dir) continue;

    // Check if this dancer is still offstage or missing in the current formation
    const currentPos = currentPositions.find(
      (p) => p.dancer_label === prevPos.dancer_label,
    );

    // If dancer exists in current formation and is on-stage, no ghost needed
    if (currentPos && !isOffstage(currentPos.x, currentPos.y, stageWidth, stageDepth)) {
      continue;
    }

    // Use current position if it exists (they might be at a different offstage spot),
    // otherwise use previous position for the ghost
    ghosts.push({
      position: currentPos ?? prevPos,
      direction: dir,
    });
  }

  if (ghosts.length === 0) return null;

  return (
    <Group>
      {ghosts.map((g) => (
        <GhostDot
          key={`ghost-${g.position.dancer_label}`}
          position={g.position}
          direction={g.direction}
          stageWidth={stageWidth}
          stageDepth={stageDepth}
          onDragOnstage={onDragOnstage}
        />
      ))}
    </Group>
  );
}
