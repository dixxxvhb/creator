import { useEffect, useRef } from 'react';
import { Group, Line, Circle, Text } from 'react-konva';
import Konva from 'konva';
import type { DancerPosition, DancerPath, PathPoint, CanvasMode } from '@/types';

interface PathLayerProps {
  paths: DancerPath[];
  positions: DancerPosition[];
  nextPositions: DancerPosition[];
  drawingPoints: PathPoint[];
  drawingDancerLabel: string | null;
  selectedPath: { formationId: string; dancerLabel: string } | null;
  canvasMode: CanvasMode;
  isDrawing?: boolean;
  onControlPointDrag: (dancerLabel: string, pointIndex: number, x: number, y: number) => void;
  onPathClick: (dancerLabel: string) => void;
}

const CONTROL_POINT_RADIUS = 6;
const PATH_STROKE_WIDTH = 3.5;
const GHOST_DOT_RADIUS = 15;

function GhostDot({
  nextPos,
  currentPos,
  isTarget,
}: {
  nextPos: DancerPosition;
  currentPos: DancerPosition;
  isTarget: boolean;
}) {
  const ringRef = useRef<Konva.Circle>(null);

  useEffect(() => {
    if (!isTarget || !ringRef.current) return;
    const anim = new Konva.Tween({
      node: ringRef.current,
      scaleX: 1.4,
      scaleY: 1.4,
      opacity: 0.2,
      duration: 0.8,
      easing: Konva.Easings.EaseInOut,
      yoyo: true,
      onFinish: function (this: Konva.Tween) {
        this.reset();
        this.play();
      },
    });
    anim.play();
    return () => anim.destroy();
  }, [isTarget]);

  return (
    <Group>
      {/* Filled landing zone */}
      <Circle
        x={nextPos.x}
        y={nextPos.y}
        radius={isTarget ? 20 : GHOST_DOT_RADIUS}
        fill={nextPos.color}
        opacity={isTarget ? 0.15 : 0.08}
        listening={false}
      />
      {/* Ghost dot outline */}
      <Circle
        x={nextPos.x}
        y={nextPos.y}
        radius={isTarget ? 20 : GHOST_DOT_RADIUS}
        stroke={nextPos.color}
        strokeWidth={isTarget ? 2.5 : 2}
        opacity={isTarget ? 0.9 : 0.4}
        dash={[4, 2.5]}
        listening={false}
      />
      {/* Pulsing ring (target only) */}
      {isTarget && (
        <Circle
          ref={ringRef}
          x={nextPos.x}
          y={nextPos.y}
          radius={24}
          stroke={nextPos.color}
          strokeWidth={2}
          opacity={0.6}
          listening={false}
        />
      )}
      {/* Ghost label */}
      <Text
        x={nextPos.x}
        y={nextPos.y}
        text={nextPos.dancer_label}
        fontSize={12}
        fill={nextPos.color}
        fontStyle="bold"
        fontFamily="Inter, system-ui, sans-serif"
        align="center"
        verticalAlign="middle"
        width={GHOST_DOT_RADIUS * 2}
        height={GHOST_DOT_RADIUS * 2}
        offsetX={GHOST_DOT_RADIUS}
        offsetY={GHOST_DOT_RADIUS}
        opacity={isTarget ? 0.7 : 0.35}
        listening={false}
      />
      {/* Connector line from current position to destination */}
      <Line
        points={[currentPos.x, currentPos.y, nextPos.x, nextPos.y]}
        stroke={nextPos.color}
        strokeWidth={1.5}
        dash={[6, 4]}
        opacity={isTarget ? 0.5 : 0.2}
        listening={false}
      />
    </Group>
  );
}

function getFullPoints(
  path: DancerPath,
  positions: DancerPosition[],
  nextPositions: DancerPosition[]
): number[] {
  const startPos = positions.find((p) => p.dancer_label === path.dancer_label);
  const endPos = nextPositions.find((p) => p.dancer_label === path.dancer_label);
  if (!startPos || !endPos) return [];

  const points: number[] = [startPos.x, startPos.y];
  for (const pt of path.path_points) {
    points.push(pt.x, pt.y);
  }
  points.push(endPos.x, endPos.y);
  return points;
}

export function PathLayer({
  paths,
  positions,
  nextPositions,
  drawingPoints,
  drawingDancerLabel,
  selectedPath,
  canvasMode,
  isDrawing = false,
  onControlPointDrag,
  onPathClick,
}: PathLayerProps) {
  const isDrawMode = canvasMode === 'draw-freehand' || canvasMode === 'draw-geometric';

  return (
    <Group>
      {/* Ghost dots — show where dancers end up in next formation */}
      {isDrawMode && nextPositions.map((nextPos) => {
        const currentPos = positions.find((p) => p.dancer_label === nextPos.dancer_label);
        if (!currentPos) return null;
        const dx = nextPos.x - currentPos.x;
        const dy = nextPos.y - currentPos.y;
        if (Math.abs(dx) < 12 && Math.abs(dy) < 12) return null;

        const isTarget = isDrawing && drawingDancerLabel === nextPos.dancer_label;

        return (
          <GhostDot
            key={`ghost-${nextPos.dancer_label}`}
            nextPos={nextPos}
            currentPos={currentPos}
            isTarget={isTarget}
          />
        );
      })}

      {/* Saved paths */}
      {paths.map((path) => {
        const fullPoints = getFullPoints(path, positions, nextPositions);
        if (fullPoints.length < 4) return null;

        const dancer = positions.find((p) => p.dancer_label === path.dancer_label);
        const color = dancer?.color ?? '#3B82F6';
        const isSelected =
          selectedPath?.dancerLabel === path.dancer_label;
        const tension = path.path_type === 'freehand' ? 0.3 : 0;

        return (
          <Group key={path.id}>
            {/* Path line */}
            <Line
              points={fullPoints}
              stroke={color}
              strokeWidth={isSelected ? PATH_STROKE_WIDTH * 1.5 : PATH_STROKE_WIDTH}
              opacity={isSelected ? 0.8 : 0.5}
              tension={tension}
              lineCap="round"
              lineJoin="round"
              dash={path.path_type === 'geometric' ? [8, 5] : undefined}
              hitStrokeWidth={15}
              listening={canvasMode === 'select'}
              onClick={() => onPathClick(path.dancer_label)}
              onTap={() => onPathClick(path.dancer_label)}
            />

            {/* Control points — only when selected */}
            {isSelected &&
              path.path_points.map((pt, idx) => (
                <Circle
                  key={idx}
                  x={pt.x}
                  y={pt.y}
                  radius={CONTROL_POINT_RADIUS}
                  fill={color}
                  stroke="#ffffff"
                  strokeWidth={1.5}
                  draggable
                  onDragMove={(e) => {
                    const node = e.target;
                    onControlPointDrag(path.dancer_label, idx, node.x(), node.y());
                  }}
                />
              ))}
          </Group>
        );
      })}

      {/* In-progress drawing */}
      {drawingDancerLabel && drawingPoints.length >= 1 && (() => {
        const dancer = positions.find((p) => p.dancer_label === drawingDancerLabel);
        if (!dancer) return null;

        const points: number[] = [dancer.x, dancer.y];
        for (const pt of drawingPoints) {
          points.push(pt.x, pt.y);
        }

        const isGeometric = canvasMode === 'draw-geometric';

        return (
          <Group>
            <Line
              points={points}
              stroke={dancer.color}
              strokeWidth={5}
              opacity={0.9}
              tension={isGeometric ? 0 : 0.3}
              lineCap="round"
              lineJoin="round"
              dash={[5, 4]}
              listening={false}
            />
            {/* Waypoint markers for geometric mode */}
            {isGeometric && drawingPoints.map((pt, idx) => (
              <Circle
                key={idx}
                x={pt.x}
                y={pt.y}
                radius={4.5}
                fill={dancer.color}
                stroke="#ffffff"
                strokeWidth={1.25}
                opacity={0.9}
                listening={false}
              />
            ))}
          </Group>
        );
      })()}
    </Group>
  );
}
