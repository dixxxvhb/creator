import { create } from 'zustand';
import type { Formation, FormationInsert, FormationUpdate, DancerPosition, DancerPositionInsert } from '@/types';
import * as formationsService from '@/services/formations';
import * as positionsService from '@/services/dancerPositions';
import { toast } from '@/stores/toastStore';

interface FormationState {
  formations: Formation[];
  positions: Record<string, DancerPosition[]>; // keyed by formation_id
  activeFormationId: string | null;
  isLoading: boolean;
  isDirty: boolean;
  error: string | null;

  load: (pieceId: string) => Promise<void>;
  addFormation: (formation: FormationInsert) => Promise<Formation | null>;
  updateFormation: (id: string, updates: FormationUpdate) => Promise<void>;
  removeFormation: (id: string) => Promise<void>;
  setActiveFormation: (id: string) => void;
  updateLocalPosition: (formationId: string, positionId: string, x: number, y: number) => void;
  savePositions: (formationId: string, positions: DancerPositionInsert[]) => Promise<void>;
  goNext: () => void;
  goPrev: () => void;
  reset: () => void;
}

export const useFormationStore = create<FormationState>((set, get) => ({
  formations: [],
  positions: {},
  activeFormationId: null,
  isLoading: false,
  isDirty: false,
  error: null,

  load: async (pieceId) => {
    set({ isLoading: true, error: null });
    try {
      const formations = await formationsService.fetchFormations(pieceId);
      const formationIds = formations.map((f) => f.id);
      const positions = formationIds.length > 0
        ? await positionsService.fetchPositionsBatch(formationIds)
        : {};
      set({
        formations,
        positions,
        activeFormationId: formations[0]?.id ?? null,
        isLoading: false,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load formations';
      set({ error: message, isLoading: false });
      toast.error(message);
    }
  },

  addFormation: async (formation) => {
    try {
      const created = await formationsService.createFormation(formation);
      set((state) => ({
        formations: [...state.formations, created],
        activeFormationId: created.id,
      }));
      return created;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create formation';
      toast.error(message);
      return null;
    }
  },

  updateFormation: async (id, updates) => {
    try {
      const updated = await formationsService.updateFormation(id, updates);
      set((state) => ({
        formations: state.formations.map((f) => (f.id === id ? updated : f)),
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update formation';
      toast.error(message);
    }
  },

  removeFormation: async (id) => {
    try {
      await formationsService.deleteFormation(id);
      set((state) => {
        const formations = state.formations.filter((f) => f.id !== id);
        const newPositions = { ...state.positions };
        delete newPositions[id];
        return {
          formations,
          positions: newPositions,
          activeFormationId:
            state.activeFormationId === id
              ? formations[0]?.id ?? null
              : state.activeFormationId,
        };
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete formation';
      toast.error(message);
    }
  },

  setActiveFormation: (id) => set({ activeFormationId: id }),

  updateLocalPosition: (formationId, positionId, x, y) => {
    set((state) => {
      const formationPositions = state.positions[formationId];
      if (!formationPositions) return state;
      return {
        isDirty: true,
        positions: {
          ...state.positions,
          [formationId]: formationPositions.map((p) =>
            p.id === positionId ? { ...p, x, y } : p
          ),
        },
      };
    });
  },

  goNext: () => {
    const { formations, activeFormationId } = get();
    const idx = formations.findIndex((f) => f.id === activeFormationId);
    if (idx >= 0 && idx + 1 < formations.length) {
      set({ activeFormationId: formations[idx + 1].id });
    }
  },

  goPrev: () => {
    const { formations, activeFormationId } = get();
    const idx = formations.findIndex((f) => f.id === activeFormationId);
    if (idx > 0) {
      set({ activeFormationId: formations[idx - 1].id });
    }
  },

  savePositions: async (formationId, positionInserts) => {
    try {
      const saved = await positionsService.upsertPositions(formationId, positionInserts);
      set((state) => ({
        positions: { ...state.positions, [formationId]: saved },
        isDirty: false,
      }));
      toast.success('Positions saved');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save positions';
      toast.error(message);
    }
  },

  reset: () =>
    set({
      formations: [],
      positions: {},
      activeFormationId: null,
      isLoading: false,
      isDirty: false,
      error: null,
    }),
}));
