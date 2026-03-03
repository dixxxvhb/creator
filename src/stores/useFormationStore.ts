import { create } from 'zustand'
import { nanoid } from 'nanoid'
import type { Formation, DancerPosition } from '@/types/formation'

interface FormationState {
  formations: Formation[]
  activeFormationId: string | null
  isDirty: boolean

  setFormations: (formations: Formation[]) => void
  setActiveFormation: (id: string) => void
  addFormation: (dancerPositions: DancerPosition[]) => void
  duplicateFormation: (id: string) => void
  deleteFormation: (id: string) => void
  updateDancerPosition: (dancerId: string, x: number, y: number) => void
  renameFormation: (id: string, name: string) => void
  markClean: () => void
  reset: () => void
}

export const useFormationStore = create<FormationState>()((set, get) => ({
  formations: [],
  activeFormationId: null,
  isDirty: false,

  setFormations: (formations) =>
    set({
      formations,
      activeFormationId: formations.length > 0 ? formations[0].id : null,
    }),

  setActiveFormation: (id) => set({ activeFormationId: id }),

  addFormation: (dancerPositions) => {
    const { formations } = get()
    const newFormation: Formation = {
      id: nanoid(),
      name: `Formation ${formations.length + 1}`,
      order_index: formations.length,
      dancer_positions: dancerPositions,
      timestamp_seconds: null,
    }
    set({
      formations: [...formations, newFormation],
      activeFormationId: newFormation.id,
      isDirty: true,
    })
  },

  duplicateFormation: (id) => {
    const { formations } = get()
    const source = formations.find((f) => f.id === id)
    if (!source) return
    const duplicate: Formation = {
      ...structuredClone(source),
      id: nanoid(),
      name: `${source.name} (copy)`,
      order_index: formations.length,
    }
    set({
      formations: [...formations, duplicate],
      activeFormationId: duplicate.id,
      isDirty: true,
    })
  },

  deleteFormation: (id) => {
    const { formations, activeFormationId } = get()
    if (formations.length <= 1) return // keep at least one
    const filtered = formations.filter((f) => f.id !== id)
    const reindexed = filtered.map((f, i) => ({ ...f, order_index: i }))
    set({
      formations: reindexed,
      activeFormationId:
        activeFormationId === id ? reindexed[0]?.id ?? null : activeFormationId,
      isDirty: true,
    })
  },

  updateDancerPosition: (dancerId, x, y) => {
    const { formations, activeFormationId } = get()
    set({
      formations: formations.map((f) =>
        f.id === activeFormationId
          ? {
              ...f,
              dancer_positions: f.dancer_positions.map((d) =>
                d.dancer_id === dancerId ? { ...d, x, y } : d,
              ),
            }
          : f,
      ),
      isDirty: true,
    })
  },

  renameFormation: (id, name) => {
    const { formations } = get()
    set({
      formations: formations.map((f) => (f.id === id ? { ...f, name } : f)),
      isDirty: true,
    })
  },

  markClean: () => set({ isDirty: false }),
  reset: () => set({ formations: [], activeFormationId: null, isDirty: false }),
}))
