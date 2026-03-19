import { create } from 'zustand';
import type { DancerPath, PathPoint } from '@/types';
import * as pathsService from '@/services/dancerPaths';
import { toast } from '@/stores/toastStore';

interface PathState {
  paths: Record<string, DancerPath[]>; // keyed by formation_id
  selectedPath: { formationId: string; dancerLabel: string } | null;
  isDrawing: boolean;
  drawingPoints: PathPoint[];
  drawingDancerLabel: string | null;

  loadPaths: (formationIds: string[]) => Promise<void>;
  savePath: (
    formationId: string,
    dancerLabel: string,
    points: PathPoint[],
    pathType: 'freehand' | 'geometric'
  ) => Promise<void>;
  removePath: (formationId: string, dancerLabel: string) => Promise<void>;
  selectPath: (formationId: string, dancerLabel: string) => void;
  startDrawing: (dancerLabel: string) => void;
  addDrawingPoint: (x: number, y: number) => void;
  finishDrawing: (formationId: string, pathType: 'freehand' | 'geometric') => Promise<void>;
  cancelDrawing: () => void;
  stopEditing: () => void;
  reset: () => void;
}

export const usePathStore = create<PathState>((set, get) => ({
  paths: {},
  selectedPath: null,
  isDrawing: false,
  drawingPoints: [],
  drawingDancerLabel: null,

  loadPaths: async (formationIds) => {
    try {
      const paths = await pathsService.fetchPathsBatch(formationIds);
      set({ paths });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load paths';
      toast.error(message);
    }
  },

  savePath: async (formationId, dancerLabel, points, pathType) => {
    try {
      const saved = await pathsService.upsertPath(formationId, dancerLabel, points, pathType);
      set((state) => {
        const existing = state.paths[formationId] ?? [];
        const without = existing.filter((p) => p.dancer_label !== dancerLabel);
        return {
          paths: {
            ...state.paths,
            [formationId]: [...without, saved],
          },
        };
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save path';
      toast.error(message);
      throw err;
    }
  },

  removePath: async (formationId, dancerLabel) => {
    try {
      await pathsService.deletePath(formationId, dancerLabel);
      set((state) => {
        const existing = state.paths[formationId] ?? [];
        return {
          paths: {
            ...state.paths,
            [formationId]: existing.filter((p) => p.dancer_label !== dancerLabel),
          },
          selectedPath:
            state.selectedPath?.formationId === formationId &&
            state.selectedPath?.dancerLabel === dancerLabel
              ? null
              : state.selectedPath,
        };
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to remove path';
      toast.error(message);
    }
  },

  selectPath: (formationId, dancerLabel) => {
    set({ selectedPath: { formationId, dancerLabel } });
  },

  startDrawing: (dancerLabel) => {
    set({
      isDrawing: true,
      drawingPoints: [],
      drawingDancerLabel: dancerLabel,
      selectedPath: null,
    });
  },

  addDrawingPoint: (x, y) => {
    set((state) => ({
      drawingPoints: [...state.drawingPoints, { x, y }],
    }));
  },

  finishDrawing: async (formationId, pathType) => {
    const { drawingPoints, drawingDancerLabel } = get();

    if (drawingPoints.length === 0 || !drawingDancerLabel) {
      set({
        isDrawing: false,
        drawingPoints: [],
        drawingDancerLabel: null,
      });
      return;
    }

    const label = drawingDancerLabel;
    const points = drawingPoints;

    set({
      isDrawing: false,
      drawingPoints: [],
      drawingDancerLabel: null,
    });

    await get().savePath(formationId, label, points, pathType);
  },

  cancelDrawing: () => {
    set({
      isDrawing: false,
      drawingPoints: [],
      drawingDancerLabel: null,
    });
  },

  stopEditing: () => {
    set({
      selectedPath: null,
      isDrawing: false,
      drawingPoints: [],
      drawingDancerLabel: null,
    });
  },

  reset: () =>
    set({
      paths: {},
      selectedPath: null,
      isDrawing: false,
      drawingPoints: [],
      drawingDancerLabel: null,
    }),
}));
