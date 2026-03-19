import { create } from 'zustand';
import type { Piece, PieceInsert, PieceUpdate } from '@/types';
import * as piecesService from '@/services/pieces';
import { toast } from '@/stores/toastStore';

interface PieceState {
  pieces: Piece[];
  isLoading: boolean;
  error: string | null;
  load: () => Promise<void>;
  add: (piece: PieceInsert) => Promise<Piece | null>;
  update: (id: string, updates: PieceUpdate) => Promise<void>;
  remove: (id: string) => Promise<void>;
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
      toast.success('Piece deleted');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete piece';
      toast.error(message);
    }
  },

  getById: (id) => get().pieces.find((p) => p.id === id),
}));
