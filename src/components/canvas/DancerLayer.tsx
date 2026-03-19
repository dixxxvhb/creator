import { Group } from 'react-konva';
import { DancerDot } from './DancerDot';
import type { DancerPosition, CanvasMode } from '@/types';

interface DancerLayerProps {
  positions: (DancerPosition & { opacity?: number })[];
  snapToGrid: boolean;
  interactive?: boolean;
  canvasMode?: CanvasMode;
  onDragMove: (id: string, x: number, y: number) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
}

export function DancerLayer({ positions, snapToGrid, interactive = true, canvasMode = 'select', onDragMove, onDragEnd }: DancerLayerProps) {
  return (
    <Group>
      {positions.map((pos) => (
        <DancerDot
          key={pos.id}
          position={pos}
          snapToGrid={snapToGrid}
          interactive={interactive}
          canvasMode={canvasMode}
          opacity={'opacity' in pos ? pos.opacity : 1}
          onDragMove={onDragMove}
          onDragEnd={onDragEnd}
        />
      ))}
    </Group>
  );
}
