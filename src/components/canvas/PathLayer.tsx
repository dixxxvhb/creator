import { Group, Line, Circle, Text } from 'react-konva';
import type { DancerPath, DancerPosition, PathPoint, CanvasMode } from '@/types';

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

const CONTROL_POINT_RADIUS = 0.25;
const PATH_STROKE_WIDTH = 0.15;
const GHOST_DOT_RADIUS = 0.6;

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
        // Only show ghost if position actually changes
        const dx = nextPos.x - currentPos.x;
        const dy = nextPos.y - currentPos.y;
        if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return null;

        // Highlight the active drawing target's ghost more
        const isTarget = isDrawing && drawingDancerLabel === nextPos.dancer_label;

        return (
          <Group key={`ghost-${nextPos.dancer_label}`}>
            {/* Ghost dot outline */}
            <Circle
              x={nextPos.x}
              y={nextPos.y}
              radius={GHOST_DOT_RADIUS}
              stroke={nextPos.color}
              strokeWidth={0.08}
              opacity={isTarget ? 0.7 : 0.25}
              dash={[0.15, 0.1]}
              listening={false}
            />
            {/* Ghost label */}
            <Text
              x={nextPos.x}
              y={nextPos.y}
              text={nextPos.dancer_label}
              fontSize={0.5}
              fill={nextPos.color}
              fontStyle="bold"
              fontFamily="Inter, system-ui, sans-serif"
              align="center"
              verticalAlign="middle"
              width={GHOST_DOT_RADIUS * 2}
              height={GHOST_DOT_RADIUS * 2}
              offsetX={GHOST_DOT_RADIUS}
              offsetY={GHOST_DOT_RADIUS}
              opacity={isTarget ? 0.6 : 0.2}
              listening={false}
            />
          </Group>
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
              dash={path.path_type === 'geometric' ? [0.3, 0.2] : undefined}
              hitStrokeWidth={0.6}
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
                  strokeWidth={0.06}
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
              strokeWidth={0.2}
              opacity={0.9}
              tension={isGeometric ? 0 : 0.3}
              lineCap="round"
              lineJoin="round"
              dash={[0.2, 0.15]}
              listening={false}
            />
            {/* Waypoint markers for geometric mode */}
            {isGeometric && drawingPoints.map((pt, idx) => (
              <Circle
                key={idx}
                x={pt.x}
                y={pt.y}
                radius={0.18}
                fill={dancer.color}
                stroke="#ffffff"
                strokeWidth={0.05}
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
