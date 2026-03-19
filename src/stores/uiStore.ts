import { create } from 'zustand';
import type { CanvasMode } from '@/types';

interface UIState {
  theme: 'dark' | 'light';
  sidebarOpen: boolean;
  showGrid: boolean;
  snapToGrid: boolean;
  canvasMode: CanvasMode;
  toggleTheme: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleGrid: () => void;
  toggleSnap: () => void;
  setCanvasMode: (mode: CanvasMode) => void;
}

export const useUIStore = create<UIState>((set) => {
  // Initialize theme from localStorage
  const savedTheme = (typeof window !== 'undefined'
    ? localStorage.getItem('creator-theme')
    : null) as 'dark' | 'light' | null;
  const initialTheme = savedTheme ?? 'dark';

  // Apply initial theme class
  if (typeof window !== 'undefined') {
    document.documentElement.classList.toggle('light', initialTheme === 'light');
  }

  return {
    theme: initialTheme,
    sidebarOpen: false,
    showGrid: true,
    snapToGrid: false,
    canvasMode: 'select' as CanvasMode,
    toggleTheme: () =>
      set((state) => {
        const next = state.theme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('creator-theme', next);
        document.documentElement.classList.toggle('light', next === 'light');
        return { theme: next };
      }),
    setSidebarOpen: (open) => set({ sidebarOpen: open }),
    toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),
    toggleSnap: () => set((state) => ({ snapToGrid: !state.snapToGrid })),
    setCanvasMode: (mode) => set({ canvasMode: mode }),
  };
});
