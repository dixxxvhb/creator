import { useFormationStore } from '@/stores/useFormationStore'
import { FormationThumbnail } from './FormationThumbnail'

export function FormationStrip() {
  const formations = useFormationStore((s) => s.formations)
  const activeFormationId = useFormationStore((s) => s.activeFormationId)
  const setActiveFormation = useFormationStore((s) => s.setActiveFormation)
  const addFormation = useFormationStore((s) => s.addFormation)
  const duplicateFormation = useFormationStore((s) => s.duplicateFormation)
  const deleteFormation = useFormationStore((s) => s.deleteFormation)

  const activeFormation = formations.find((f) => f.id === activeFormationId)

  const handleAdd = () => {
    if (activeFormation) {
      // New formation starts with current dancer positions
      addFormation(structuredClone(activeFormation.dancer_positions))
    }
  }

  return (
    <div className="bg-gray-900 border-t border-gray-800 shrink-0">
      {/* Actions bar */}
      <div className="flex items-center gap-2 px-4 py-1.5 border-b border-gray-800">
        <span className="text-xs text-gray-500 mr-auto">
          Formations ({formations.length})
        </span>
        {activeFormationId && (
          <>
            <button
              onClick={() => duplicateFormation(activeFormationId)}
              className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded bg-gray-800"
            >
              Duplicate
            </button>
            <button
              onClick={() => deleteFormation(activeFormationId)}
              disabled={formations.length <= 1}
              className="text-xs text-gray-400 hover:text-red-400 disabled:opacity-30 px-2 py-1 rounded bg-gray-800"
            >
              Delete
            </button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      <div className="flex items-center gap-3 overflow-x-auto px-4 py-3">
        {formations.map((f) => (
          <FormationThumbnail
            key={f.id}
            formation={f}
            isActive={f.id === activeFormationId}
            onClick={() => setActiveFormation(f.id)}
          />
        ))}
        <button
          onClick={handleAdd}
          className="flex-shrink-0 w-24 h-16 rounded border-2 border-dashed border-gray-700 text-gray-500 hover:border-gray-500 hover:text-gray-300 flex items-center justify-center text-2xl transition-colors"
        >
          +
        </button>
      </div>
    </div>
  )
}
