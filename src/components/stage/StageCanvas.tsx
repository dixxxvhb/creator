import { Stage, Layer, Rect } from 'react-konva'
import { useStageStore } from '@/stores/useStageStore'
import { useFormationStore } from '@/stores/useFormationStore'
import { DancerDot } from './DancerDot'
import { STAGE_PRESETS } from '@/types/stage'

export function StageCanvas() {
  const stageWidth = useStageStore((s) => s.stageWidth)
  const stageHeight = useStageStore((s) => s.stageHeight)
  const setDimensions = useStageStore((s) => s.setDimensions)
  const formations = useFormationStore((s) => s.formations)
  const activeFormationId = useFormationStore((s) => s.activeFormationId)
  const updateDancerPosition = useFormationStore((s) => s.updateDancerPosition)

  const activeFormation = formations.find((f) => f.id === activeFormationId)

  return (
    <div className="flex flex-col items-center flex-1 overflow-hidden">
      {/* Stage size controls */}
      <div className="flex items-center gap-2 py-2 px-4">
        <span className="text-xs text-gray-500">Stage:</span>
        {Object.entries(STAGE_PRESETS).map(([name, dims]) => (
          <button
            key={name}
            onClick={() => setDimensions(dims.width, dims.height)}
            className={`text-xs px-2 py-1 rounded ${
              stageWidth === dims.width && stageHeight === dims.height
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            {name}
          </button>
        ))}
        <span className="text-xs text-gray-600 ml-2">
          {stageWidth} x {stageHeight}
        </span>
      </div>

      {/* Canvas */}
      <div
        className="border border-gray-700 rounded-lg overflow-hidden"
        style={{ touchAction: 'none' }}
      >
        <Stage width={stageWidth} height={stageHeight}>
          <Layer>
            {/* Stage floor */}
            <Rect
              width={stageWidth}
              height={stageHeight}
              fill="#1a1a2e"
            />
            {/* Stage border */}
            <Rect
              x={2}
              y={2}
              width={stageWidth - 4}
              height={stageHeight - 4}
              stroke="#374151"
              strokeWidth={1}
              listening={false}
            />
            {/* Center mark */}
            <Rect
              x={stageWidth / 2 - 1}
              y={0}
              width={2}
              height={stageHeight}
              fill="#374151"
              opacity={0.3}
              listening={false}
            />

            {/* Dancers */}
            {activeFormation?.dancer_positions.map((dancer) => (
              <DancerDot
                key={dancer.dancer_id}
                dancer={dancer}
                stageWidth={stageWidth}
                stageHeight={stageHeight}
                onDragEnd={(id, x, y) => updateDancerPosition(id, x, y)}
              />
            ))}
          </Layer>
        </Stage>
      </div>
    </div>
  )
}
