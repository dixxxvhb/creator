import { Group, Line } from 'react-konva';

// Stage number coordinate system:
// 1 stage number = 2.5 coordinate units
// Grid shows lines at every 0.5 stage numbers (1.25 units)
const HALF_STAGE_NUM = 1.25;  // minor grid spacing
const FULL_STAGE_NUM = 2.5;   // medium grid spacing
const MAJOR_SPACING = 5;      // major grid spacing (= 2 stage numbers, matches labels 0,2,4,6,8)

interface GridLayerProps {
  stageWidth: number;
  stageDepth: number;
  visible: boolean;
}

export function GridLayer({ stageWidth, stageDepth, visible }: GridLayerProps) {
  if (!visible) return null;

  const lines: React.ReactElement[] = [];
  const cx = stageWidth / 2;
  const cy = stageDepth / 2;

  // Vertical lines — anchored to center, radiating outward
  for (let offset = 0; offset <= stageWidth / 2; offset += HALF_STAGE_NUM) {
    const positions = offset === 0 ? [cx] : [cx + offset, cx - offset];
    for (const x of positions) {
      if (x < -0.01 || x > stageWidth + 0.01) continue;
      const isMajor = Math.abs(offset % MAJOR_SPACING) < 0.01;
      const isMedium = !isMajor && Math.abs(offset % FULL_STAGE_NUM) < 0.01;
      lines.push(
        <Line
          key={`v-${x.toFixed(2)}`}
          points={[x, 0, x, stageDepth]}
          stroke={isMajor ? 'rgba(148, 163, 184, 0.3)' : isMedium ? 'rgba(148, 163, 184, 0.15)' : 'rgba(148, 163, 184, 0.07)'}
          strokeWidth={isMajor ? 0.06 : 0.03}
          listening={false}
        />
      );
    }
  }

  // Horizontal lines — anchored to center, radiating outward
  for (let offset = 0; offset <= stageDepth / 2; offset += HALF_STAGE_NUM) {
    const positions = offset === 0 ? [cy] : [cy + offset, cy - offset];
    for (const y of positions) {
      if (y < -0.01 || y > stageDepth + 0.01) continue;
      const isMajor = Math.abs(offset % MAJOR_SPACING) < 0.01;
      const isMedium = !isMajor && Math.abs(offset % FULL_STAGE_NUM) < 0.01;
      lines.push(
        <Line
          key={`h-${y.toFixed(2)}`}
          points={[0, y, stageWidth, y]}
          stroke={isMajor ? 'rgba(148, 163, 184, 0.3)' : isMedium ? 'rgba(148, 163, 184, 0.15)' : 'rgba(148, 163, 184, 0.07)'}
          strokeWidth={isMajor ? 0.06 : 0.03}
          listening={false}
        />
      );
    }
  }

  return <Group listening={false}>{lines}</Group>;
}
