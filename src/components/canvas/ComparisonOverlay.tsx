import { Group, Circle, Arrow, Text } from 'react-konva';
import type { DancerPosition } from '@/types';

const DOT_RADIUS = 22;
const GHOST_RADIUS = DOT_RADIUS - 4;
const ARROW_COLOR = 'rgba(148, 163, 184, 0.45)';
const GHOST_LABEL_SIZE = 10;

interface ComparisonOverlayProps {
  currentPositions: DancerPosition[];
  comparePositions: DancerPosition[];
  stageWidth: number;
  stageHeight: number;
}

export function ComparisonOverlay({
  currentPositions,
  comparePositions,
}: ComparisonOverlayProps) {
  // Build a lookup of current positions by dancer_label
  const currentByLabel = new Map<string, DancerPosition>();
  for (const pos of currentPositions) {
    currentByLabel.set(pos.dancer_label, pos);
  }

  return (
    <Group listening={false}>
      {comparePositions.map((comparePos) => {
        const currentPos = currentByLabel.get(comparePos.dancer_label);
        const hasMatch = !!currentPos;
        const hasMoved =
          hasMatch &&
          (Math.abs(currentPos!.x - comparePos.x) > 3 ||
            Math.abs(currentPos!.y - comparePos.y) > 3);

        return (
          <Group key={`ghost-${comparePos.id}`}>
            {/* Movement arrow from ghost to current position */}
            {hasMatch && hasMoved && (
              <Arrow
                points={[
                  comparePos.x,
                  comparePos.y,
                  currentPos!.x,
                  currentPos!.y,
                ]}
                stroke={ARROW_COLOR}
                strokeWidth={1.5}
                pointerLength={6}
                pointerWidth={5}
                fill={ARROW_COLOR}
                dash={[6, 4]}
                listening={false}
              />
            )}

            {/* Ghost dot — dashed outline, semi-transparent fill */}
            <Circle
              x={comparePos.x}
              y={comparePos.y}
              radius={GHOST_RADIUS}
              fill={comparePos.color}
              opacity={0.2}
              listening={false}
            />
            <Circle
              x={comparePos.x}
              y={comparePos.y}
              radius={GHOST_RADIUS}
              stroke={comparePos.color}
              strokeWidth={1.5}
              opacity={0.4}
              dash={[4, 3]}
              listening={false}
            />

            {/* Label on ghost */}
            <Text
              x={comparePos.x}
              y={comparePos.y}
              text={hasMatch ? comparePos.dancer_label : '?'}
              fontSize={GHOST_LABEL_SIZE}
              fill={hasMatch ? comparePos.color : '#f59e0b'}
              fontFamily="Inter, system-ui, sans-serif"
              fontStyle="600"
              align="center"
              verticalAlign="middle"
              width={GHOST_RADIUS * 2}
              height={GHOST_LABEL_SIZE}
              offsetX={GHOST_RADIUS}
              offsetY={GHOST_LABEL_SIZE / 2}
              opacity={0.5}
              listening={false}
            />
          </Group>
        );
      })}
    </Group>
  );
}
