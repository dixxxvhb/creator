import { Group } from 'react-konva';
import { DancerDot } from './DancerDot';
import type { DancerPosition } from '@/types';

interface DancerLayerProps {
  positions: (DancerPosition & { opacity?: number })[];
  snapToGrid: boolean;
  interactive?: boolean;
  onDragMove: (id: string, x: number, y: number) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
}

export function DancerLayer({ positions, snapToGrid, interactive = true, onDragMove, onDragEnd }: DancerLayerProps) {
  return (
    <Group>
      {positions.map((pos) => (
        <DancerDot
          key={pos.id}
          position={pos}
          snapToGrid={snapToGrid}
          interactive={interactive}
          opacity={'opacity' in pos ? pos.opacity : 1}
          onDragMove={onDragMove}
          onDragEnd={onDragEnd}
        />
      ))}
    </Group>
  );
}
