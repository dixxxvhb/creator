import { Group, Line, Circle } from 'react-konva';
import type { DancerPath, DancerPosition, PathPoint, CanvasMode } from '@/types';

interface PathLayerProps {
  paths: DancerPath[];
  positions: DancerPosition[];
  nextPositions: DancerPosition[];
  drawingPoints: PathPoint[];
  drawingDancerLabel: string | null;
  selectedPath: { formationId: string; dancerLabel: string } | null;
  canvasMode: CanvasMode;
  onControlPointDrag: (dancerLabel: string, pointIndex: number, x: number, y: number) => void;
  onPathClick: (dancerLabel: string) => void;
}

const CONTROL_POINT_RADIUS = 0.25;
const PATH_STROKE_WIDTH = 0.15;

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
  onControlPointDrag,
  onPathClick,
}: PathLayerProps) {
  return (
    <Group>
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

        return (
          <Line
            points={points}
            stroke={dancer.color}
            strokeWidth={PATH_STROKE_WIDTH}
            opacity={0.7}
            tension={canvasMode === 'draw-freehand' ? 0.3 : 0}
            lineCap="round"
            lineJoin="round"
            dash={[0.2, 0.15]}
            listening={false}
          />
        );
      })()}
    </Group>
  );
}
