import { Group, Line } from 'react-konva';

interface GridLayerProps {
  stageWidth: number;
  stageDepth: number;
  visible: boolean;
}

export function GridLayer({ stageWidth, stageDepth, visible }: GridLayerProps) {
  if (!visible) return null;

  const lines: React.ReactElement[] = [];

  // Vertical lines
  for (let x = 0; x <= stageWidth; x++) {
    const isMajor = x % 5 === 0;
    lines.push(
      <Line
        key={`v-${x}`}
        points={[x, 0, x, stageDepth]}
        stroke={isMajor ? 'rgba(148, 163, 184, 0.25)' : 'rgba(148, 163, 184, 0.1)'}
        strokeWidth={isMajor ? 0.06 : 0.03}
        listening={false}
      />
    );
  }

  // Horizontal lines
  for (let y = 0; y <= stageDepth; y++) {
    const isMajor = y % 5 === 0;
    lines.push(
      <Line
        key={`h-${y}`}
        points={[0, y, stageWidth, y]}
        stroke={isMajor ? 'rgba(148, 163, 184, 0.25)' : 'rgba(148, 163, 184, 0.1)'}
        strokeWidth={isMajor ? 0.06 : 0.03}
        listening={false}
      />
    );
  }

  return <Group listening={false}>{lines}</Group>;
}
