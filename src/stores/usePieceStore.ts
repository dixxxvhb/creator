import { create } from 'zustand'
import type { Piece } from '@/types/piece'

interface PieceState {
  piece: Piece | null
  audioUrl: string | null
  isLoading: boolean
  setPiece: (piece: Piece) => void
  setAudioUrl: (url: string | null) => void
  setLoading: (loading: boolean) => void
  reset: () => void
}

export const usePieceStore = create<PieceState>()((set) => ({
  piece: null,
  audioUrl: null,
  isLoading: false,
  setPiece: (piece) => set({ piece }),
  setAudioUrl: (audioUrl) => set({ audioUrl }),
  setLoading: (isLoading) => set({ isLoading }),
  reset: () => set({ piece: null, audioUrl: null, isLoading: false }),
}))
