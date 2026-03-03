import { useEffect, useRef } from 'react'
import { useFormationStore } from '@/stores/useFormationStore'
import { usePieceStore } from '@/stores/usePieceStore'
import { saveFormations } from '@/services/formationService'

const DEBOUNCE_MS = 2000

export function useAutoSave() {
  const isDirty = useFormationStore((s) => s.isDirty)
  const formations = useFormationStore((s) => s.formations)
  const markClean = useFormationStore((s) => s.markClean)
  const pieceId = usePieceStore((s) => s.piece?.id)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    if (!isDirty || !pieceId) return

    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      try {
        await saveFormations(pieceId, formations)
        markClean()
      } catch (err) {
        console.error('Auto-save failed:', err)
      }
    }, DEBOUNCE_MS)

    return () => clearTimeout(timerRef.current)
  }, [isDirty, formations, pieceId, markClean])
}
