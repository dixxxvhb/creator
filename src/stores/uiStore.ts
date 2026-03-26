import { create } from 'zustand';
import type { CanvasMode } from '@/types';

export type AudiencePosition = 'top' | 'bottom';

interface UIState {
  sidebarOpen: boolean;
  showGrid: boolean;
  snapToGrid: boolean;
  showStageNumbers: boolean;
  canvasMode: CanvasMode;
  audiencePosition: AudiencePosition;
  showComparison: boolean;
  selectedDancerIds: string[];
  setSidebarOpen: (open: boolean) => void;
  toggleComparison: () => void;
  toggleGrid: () => void;
  toggleSnap: () => void;
  toggleStageNumbers: () => void;
  setCanvasMode: (mode: CanvasMode) => void;
  setAudiencePosition: (pos: AudiencePosition) => void;
  toggleDancerSelection: (id: string) => void;
  setDancerSelection: (ids: string[]) => void;
  clearDancerSelection: () => void;
  addToDancerSelection: (id: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: false,
  showGrid: true,
  snapToGrid: false,
  showStageNumbers: true,
  canvasMode: 'select' as CanvasMode,
  audiencePosition: 'top',
  showComparison: false,
  selectedDancerIds: [],
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleComparison: () => set((state) => ({ showComparison: !state.showComparison })),
  toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),
  toggleSnap: () => set((state) => ({ snapToGrid: !state.snapToGrid })),
  toggleStageNumbers: () => set((state) => ({ showStageNumbers: !state.showStageNumbers })),
  setCanvasMode: (mode) => set({ canvasMode: mode }),
  setAudiencePosition: (pos) => set({ audiencePosition: pos }),
  toggleDancerSelection: (id) =>
    set((state) => ({
      selectedDancerIds: state.selectedDancerIds.includes(id)
        ? state.selectedDancerIds.filter((d) => d !== id)
        : [...state.selectedDancerIds, id],
    })),
  setDancerSelection: (ids) => set({ selectedDancerIds: ids }),
  clearDancerSelection: () => set({ selectedDancerIds: [] }),
  addToDancerSelection: (id) =>
    set((state) => ({
      selectedDancerIds: state.selectedDancerIds.includes(id)
        ? state.selectedDancerIds
        : [...state.selectedDancerIds, id],
    })),
}));
