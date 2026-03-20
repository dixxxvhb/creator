import { create } from 'zustand';
import type { DancerPath, PathPoint } from '@/types';
import * as pathsService from '@/services/dancerPaths';
import { toast } from '@/stores/toastStore';

interface UndoEntry {
  type: 'save' | 'remove';
  formationId: string;
  dancerLabel: string;
  /** The path that existed before the action (null if none) */
  previousPath: DancerPath | null;
  /** The path that was created by the action (null if removed) */
  newPath: DancerPath | null;
}

interface PathState {
  paths: Record<string, DancerPath[]>; // keyed by formation_id
  selectedPath: { formationId: string; dancerLabel: string } | null;
  isDrawing: boolean;
  /** True when drawing is driven by DancerDot drag (vs stage mousemove) */
  isDragDrawing: boolean;
  drawingPoints: PathPoint[];
  drawingDancerLabel: string | null;
  undoStack: UndoEntry[];

  loadPaths: (formationIds: string[]) => Promise<void>;
  savePath: (
    formationId: string,
    dancerLabel: string,
    points: PathPoint[],
    pathType: 'freehand' | 'geometric'
  ) => Promise<void>;
  removePath: (formationId: string, dancerLabel: string) => Promise<void>;
  undo: () => Promise<void>;
  selectPath: (formationId: string, dancerLabel: string) => void;
  startDrawing: (dancerLabel: string, dragDraw?: boolean) => void;
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
  isDragDrawing: false,
  drawingPoints: [],
  drawingDancerLabel: null,
  undoStack: [],

  loadPaths: async (formationIds) => {
    try {
      const paths = await pathsService.fetchPathsBatch(formationIds);
      set({ paths, undoStack: [] });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load paths';
      toast.error(message);
    }
  },

  savePath: async (formationId, dancerLabel, points, pathType) => {
    try {
      // Capture the previous path for undo
      const existing = get().paths[formationId] ?? [];
      const previousPath = existing.find((p) => p.dancer_label === dancerLabel) ?? null;

      const saved = await pathsService.upsertPath(formationId, dancerLabel, points, pathType);
      set((state) => {
        const formPaths = state.paths[formationId] ?? [];
        const without = formPaths.filter((p) => p.dancer_label !== dancerLabel);
        return {
          paths: {
            ...state.paths,
            [formationId]: [...without, saved],
          },
          undoStack: [...state.undoStack, {
            type: 'save' as const,
            formationId,
            dancerLabel,
            previousPath,
            newPath: saved,
          }].slice(-20), // keep last 20 actions
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
      // Capture the path being removed for undo
      const existing = get().paths[formationId] ?? [];
      const previousPath = existing.find((p) => p.dancer_label === dancerLabel) ?? null;

      await pathsService.deletePath(formationId, dancerLabel);
      set((state) => {
        const formPaths = state.paths[formationId] ?? [];
        return {
          paths: {
            ...state.paths,
            [formationId]: formPaths.filter((p) => p.dancer_label !== dancerLabel),
          },
          selectedPath:
            state.selectedPath?.formationId === formationId &&
            state.selectedPath?.dancerLabel === dancerLabel
              ? null
              : state.selectedPath,
          undoStack: [...state.undoStack, {
            type: 'remove' as const,
            formationId,
            dancerLabel,
            previousPath,
            newPath: null,
          }].slice(-20),
        };
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to remove path';
      toast.error(message);
    }
  },

  undo: async () => {
    const { undoStack } = get();
    if (undoStack.length === 0) return;

    const entry = undoStack[undoStack.length - 1];
    try {
      if (entry.type === 'save') {
        // Undo a save: restore the previous path (or delete if none existed)
        if (entry.previousPath) {
          await pathsService.upsertPath(
            entry.formationId,
            entry.dancerLabel,
            entry.previousPath.path_points,
            entry.previousPath.path_type
          );
          set((state) => {
            const formPaths = state.paths[entry.formationId] ?? [];
            const without = formPaths.filter((p) => p.dancer_label !== entry.dancerLabel);
            return {
              paths: {
                ...state.paths,
                [entry.formationId]: [...without, entry.previousPath!],
              },
              undoStack: state.undoStack.slice(0, -1),
            };
          });
        } else {
          await pathsService.deletePath(entry.formationId, entry.dancerLabel);
          set((state) => {
            const formPaths = state.paths[entry.formationId] ?? [];
            return {
              paths: {
                ...state.paths,
                [entry.formationId]: formPaths.filter((p) => p.dancer_label !== entry.dancerLabel),
              },
              undoStack: state.undoStack.slice(0, -1),
            };
          });
        }
      } else if (entry.type === 'remove' && entry.previousPath) {
        // Undo a remove: re-save the deleted path
        const restored = await pathsService.upsertPath(
          entry.formationId,
          entry.dancerLabel,
          entry.previousPath.path_points,
          entry.previousPath.path_type
        );
        set((state) => {
          const formPaths = state.paths[entry.formationId] ?? [];
          return {
            paths: {
              ...state.paths,
              [entry.formationId]: [...formPaths, restored],
            },
            undoStack: state.undoStack.slice(0, -1),
          };
        });
      }
      toast.success('Undone');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to undo';
      toast.error(message);
    }
  },

  selectPath: (formationId, dancerLabel) => {
    set({ selectedPath: { formationId, dancerLabel } });
  },

  startDrawing: (dancerLabel, dragDraw = false) => {
    set({
      isDrawing: true,
      isDragDrawing: dragDraw,
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
      isDragDrawing: false,
      drawingPoints: [],
      drawingDancerLabel: null,
    });

    await get().savePath(formationId, label, points, pathType);
  },

  cancelDrawing: () => {
    set({
      isDrawing: false,
      isDragDrawing: false,
      drawingPoints: [],
      drawingDancerLabel: null,
    });
  },

  stopEditing: () => {
    set({
      selectedPath: null,
      isDrawing: false,
      isDragDrawing: false,
      drawingPoints: [],
      drawingDancerLabel: null,
    });
  },

  reset: () =>
    set({
      paths: {},
      selectedPath: null,
      isDrawing: false,
      isDragDrawing: false,
      drawingPoints: [],
      drawingDancerLabel: null,
      undoStack: [],
    }),
}));
