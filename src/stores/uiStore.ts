import { create } from 'zustand';
import type { CanvasMode } from '@/types';

interface UIState {
  sidebarOpen: boolean;
  showGrid: boolean;
  snapToGrid: boolean;
  canvasMode: CanvasMode;
  setSidebarOpen: (open: boolean) => void;
  toggleGrid: () => void;
  toggleSnap: () => void;
  setCanvasMode: (mode: CanvasMode) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: false,
  showGrid: true,
  snapToGrid: false,
  canvasMode: 'select' as CanvasMode,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),
  toggleSnap: () => set((state) => ({ snapToGrid: !state.snapToGrid })),
  setCanvasMode: (mode) => set({ canvasMode: mode }),
}));
