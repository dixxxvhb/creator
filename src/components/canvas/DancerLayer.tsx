import { Group } from 'react-konva';
import { DancerDot } from './DancerDot';
import type { DancerPosition } from '@/types';

interface DancerLayerProps {
  positions: DancerPosition[];
  snapToGrid: boolean;
  onDragMove: (id: string, x: number, y: number) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
}

export function DancerLayer({ positions, snapToGrid, onDragMove, onDragEnd }: DancerLayerProps) {
  return (
    <Group>
      {positions.map((pos) => (
        <DancerDot
          key={pos.id}
          position={pos}
          snapToGrid={snapToGrid}
          onDragMove={onDragMove}
          onDragEnd={onDragEnd}
        />
      ))}
    </Group>
  );
}
