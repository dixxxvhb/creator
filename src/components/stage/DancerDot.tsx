import { Group, Circle, Text } from 'react-konva'
import type Konva from 'konva'
import type { DancerPosition } from '@/types/formation'

const DANCER_RADIUS = 22

interface DancerDotProps {
  dancer: DancerPosition
  stageWidth: number
  stageHeight: number
  onDragEnd: (dancerId: string, x: number, y: number) => void
}

export function DancerDot({ dancer, stageWidth, stageHeight, onDragEnd }: DancerDotProps) {
  const pixelX = dancer.x * stageWidth
  const pixelY = dancer.y * stageHeight

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target
    const newX = Math.max(DANCER_RADIUS, Math.min(node.x(), stageWidth - DANCER_RADIUS))
    const newY = Math.max(DANCER_RADIUS, Math.min(node.y(), stageHeight - DANCER_RADIUS))
    node.position({ x: newX, y: newY })
    onDragEnd(dancer.dancer_id, newX / stageWidth, newY / stageHeight)
  }

  return (
    <Group
      x={pixelX}
      y={pixelY}
      draggable
      onDragEnd={handleDragEnd}
    >
      <Circle
        radius={DANCER_RADIUS}
        fill={dancer.color}
        stroke="#1F2937"
        strokeWidth={2}
        shadowColor="black"
        shadowBlur={4}
        shadowOpacity={0.2}
        shadowOffset={{ x: 1, y: 1 }}
      />
      <Text
        text={dancer.label}
        fontSize={14}
        fontFamily="Inter, system-ui, sans-serif"
        fill="#FFFFFF"
        fontStyle="bold"
        align="center"
        verticalAlign="middle"
        width={DANCER_RADIUS * 2}
        height={DANCER_RADIUS * 2}
        offsetX={DANCER_RADIUS}
        offsetY={DANCER_RADIUS}
        listening={false}
      />
    </Group>
  )
}
