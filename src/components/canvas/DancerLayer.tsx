import { Group } from 'react-konva';
import { DancerDot } from './DancerDot';
import type { DancerPosition, CanvasMode, Dancer } from '@/types';

interface DancerLayerProps {
  positions: (DancerPosition & { opacity?: number })[];
  snapToGrid: boolean;
  interactive?: boolean;
  canvasMode?: CanvasMode;
  /** Roster dancers for looking up display names */
  rosterDancers?: Dancer[];
  /** Label of the dancer currently being drawn for */
  drawingDancerLabel?: string | null;
  /** Whether drawing is in progress */
  isDrawing?: boolean;
  /** Whether the current formation has a next formation */
  hasNextFormation?: boolean;
  /** Stage dimensions for offstage detection */
  stageWidth?: number;
  stageDepth?: number;
  /** Active formation ID for saving drawn paths */
  activeFormationId?: string;
  onDragMove: (id: string, x: number, y: number) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
}

export function DancerLayer({
  positions,
  snapToGrid,
  interactive = true,
  canvasMode = 'select',
  rosterDancers = [],
  drawingDancerLabel = null,
  isDrawing = false,
  hasNextFormation = false,
  stageWidth,
  stageDepth,
  activeFormationId,
  onDragMove,
  onDragEnd,
}: DancerLayerProps) {
  // Build a lookup map for dancer names
  const dancerNameMap = new Map(rosterDancers.map((d) => [d.id, d.short_name]));

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
          displayName={pos.dancer_id ? dancerNameMap.get(pos.dancer_id) ?? null : null}
          isDrawingTarget={drawingDancerLabel === pos.dancer_label}
          isDrawing={isDrawing}
          hasNextFormation={hasNextFormation}
          stageWidth={stageWidth}
          stageDepth={stageDepth}
          activeFormationId={activeFormationId}
          onDragMove={onDragMove}
          onDragEnd={onDragEnd}
        />
      ))}
    </Group>
  );
}
