import { create } from 'zustand';
import type { Piece, PieceInsert, PieceUpdate } from '@/types';
import { FREE_PIECE_LIMIT } from '@/types';
import * as piecesService from '@/services/pieces';
import * as formationsService from '@/services/formations';
import * as positionsService from '@/services/dancerPositions';
import { toast } from '@/stores/toastStore';
import { useTierStore } from '@/stores/tierStore';
import { useFormationStore } from '@/stores/formationStore';
import { usePathStore } from '@/stores/pathStore';
import { useSongSectionStore } from '@/stores/songSectionStore';

interface PieceState {
  pieces: Piece[];
  isLoading: boolean;
  error: string | null;
  load: () => Promise<void>;
  add: (piece: PieceInsert) => Promise<Piece | null>;
  update: (id: string, updates: PieceUpdate) => Promise<void>;
  remove: (id: string) => Promise<void>;
  duplicate: (id: string) => Promise<Piece | null>;
  getById: (id: string) => Piece | undefined;
}

export const usePieceStore = create<PieceState>((set, get) => ({
  pieces: [],
  isLoading: false,
  error: null,

  load: async () => {
    set({ isLoading: true, error: null });
    try {
      const pieces = await piecesService.fetchPieces();
      set({ pieces, isLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load pieces';
      set({ error: message, isLoading: false });
      toast.error(message);
    }
  },

  add: async (piece) => {
    try {
      const tierStore = useTierStore.getState();
      if (!tierStore.hasFeature('unlimited_pieces')) {
        const currentCount = get().pieces.length;
        if (currentCount >= FREE_PIECE_LIMIT) {
          toast.error(`Free tier limited to ${FREE_PIECE_LIMIT} pieces. Upgrade for unlimited.`);
          return null;
        }
      }
      const created = await piecesService.createPiece(piece);
      set((state) => ({ pieces: [...state.pieces, created] }));
      toast.success('Piece created');
      return created;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create piece';
      toast.error(message);
      return null;
    }
  },

  update: async (id, updates) => {
    try {
      const updated = await piecesService.updatePiece(id, updates);
      set((state) => ({
        pieces: state.pieces.map((p) => (p.id === id ? updated : p)),
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update piece';
      toast.error(message);
    }
  },

  remove: async (id) => {
    try {
      await piecesService.deletePiece(id);
      set((state) => ({
        pieces: state.pieces.filter((p) => p.id !== id),
      }));
      // DB cascades handle related rows, but clear stale in-memory data
      // from stores that were loaded for this piece
      useFormationStore.getState().reset();
      usePathStore.getState().reset();
      useSongSectionStore.getState().reset();
      toast.success('Piece deleted');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete piece';
      toast.error(message);
    }
  },

  duplicate: async (id) => {
    try {
      const tierStore = useTierStore.getState();
      if (!tierStore.hasFeature('unlimited_pieces')) {
        const currentCount = get().pieces.length;
        if (currentCount >= FREE_PIECE_LIMIT) {
          toast.error(`Free tier limited to ${FREE_PIECE_LIMIT} pieces. Upgrade for unlimited.`);
          return null;
        }
      }
      const original = get().pieces.find((p) => p.id === id);
      if (!original) throw new Error('Piece not found');

      // Create the new piece
      const { id: _id, user_id: _uid, created_at: _c, updated_at: _u, ...fields } = original;
      const newPiece = await piecesService.createPiece({
        ...fields,
        title: `${original.title} (Copy)`,
        sort_order: get().pieces.length,
        audio_url: null, // don't copy audio reference
      });

      // Copy formations + positions
      const formations = await formationsService.fetchFormations(id);
      const formationIds = formations.map((f) => f.id);
      const allPositions = await positionsService.fetchPositionsBatch(formationIds);

      for (const formation of formations) {
        const newFormation = await formationsService.createFormation({
          piece_id: newPiece.id,
          index: formation.index,
          label: formation.label,
          timestamp_seconds: formation.timestamp_seconds,
          choreo_notes: formation.choreo_notes,
          counts_notes: formation.counts_notes,
          transition_duration_ms: formation.transition_duration_ms,
          transition_easing: formation.transition_easing,
        });

        const positions = allPositions[formation.id] ?? [];
        if (positions.length > 0) {
          await positionsService.upsertPositions(
            newFormation.id,
            positions.map((p) => ({
              formation_id: newFormation.id,
              x: p.x,
              y: p.y,
              color: p.color,
              dancer_label: p.dancer_label,
              dancer_id: p.dancer_id,
            })),
          );
        }
      }

      set((state) => ({ pieces: [...state.pieces, newPiece] }));
      toast.success(`Duplicated "${original.title}"`);
      return newPiece;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to duplicate piece';
      toast.error(message);
      return null;
    }
  },

  getById: (id) => get().pieces.find((p) => p.id === id),
}));
