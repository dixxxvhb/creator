import { create } from 'zustand'

interface StageState {
  stageWidth: number
  stageHeight: number
  scale: number
  setDimensions: (width: number, height: number) => void
  setScale: (scale: number) => void
  reset: () => void
}

export const useStageStore = create<StageState>()((set) => ({
  stageWidth: 1024,
  stageHeight: 600,
  scale: 1,
  setDimensions: (stageWidth, stageHeight) => set({ stageWidth, stageHeight }),
  setScale: (scale) => set({ scale }),
  reset: () => set({ stageWidth: 1024, stageHeight: 600, scale: 1 }),
}))
