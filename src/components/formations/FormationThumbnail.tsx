import type { Formation } from '@/types/formation'

interface FormationThumbnailProps {
  formation: Formation
  isActive: boolean
  onClick: () => void
}

const THUMB_W = 96
const THUMB_H = 56

export function FormationThumbnail({ formation, isActive, onClick }: FormationThumbnailProps) {
  return (
    <button
      onClick={onClick}
      className={`flex-shrink-0 flex flex-col items-center gap-1 group`}
    >
      <div
        className={`relative rounded overflow-hidden border-2 transition-colors ${
          isActive ? 'border-blue-500' : 'border-gray-700 group-hover:border-gray-500'
        }`}
        style={{ width: THUMB_W, height: THUMB_H }}
      >
        {/* Mini stage background */}
        <div className="absolute inset-0 bg-gray-800" />

        {/* Mini dancer dots */}
        {formation.dancer_positions.map((d) => (
          <div
            key={d.dancer_id}
            className="absolute rounded-full"
            style={{
              width: 6,
              height: 6,
              backgroundColor: d.color,
              left: d.x * THUMB_W - 3,
              top: d.y * THUMB_H - 3,
            }}
          />
        ))}
      </div>
      <span className="text-xs text-gray-400 truncate max-w-[96px]">
        {formation.name}
      </span>
    </button>
  )
}
