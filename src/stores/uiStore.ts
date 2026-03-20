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
  setSidebarOpen: (open: boolean) => void;
  toggleGrid: () => void;
  toggleSnap: () => void;
  toggleStageNumbers: () => void;
  setCanvasMode: (mode: CanvasMode) => void;
  setAudiencePosition: (pos: AudiencePosition) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: false,
  showGrid: true,
  snapToGrid: false,
  showStageNumbers: true,
  canvasMode: 'select' as CanvasMode,
  audiencePosition: 'top',
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),
  toggleSnap: () => set((state) => ({ snapToGrid: !state.snapToGrid })),
  toggleStageNumbers: () => set((state) => ({ showStageNumbers: !state.showStageNumbers })),
  setCanvasMode: (mode) => set({ canvasMode: mode }),
  setAudiencePosition: (pos) => set({ audiencePosition: pos }),
}));
