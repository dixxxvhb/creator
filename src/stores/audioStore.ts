import { create } from 'zustand';

interface AudioState {
  // Audio element state
  audioUrl: string | null;
  isAudioPlaying: boolean;
  currentTime: number;
  duration: number;

  // Actions
  setAudioUrl: (url: string | null) => void;
  setPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  reset: () => void;
}

export const useAudioStore = create<AudioState>((set) => ({
  audioUrl: null,
  isAudioPlaying: false,
  currentTime: 0,
  duration: 0,

  setAudioUrl: (url) => set({ audioUrl: url, currentTime: 0, duration: 0, isAudioPlaying: false }),
  setPlaying: (playing) => set({ isAudioPlaying: playing }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setDuration: (duration) => set({ duration }),
  reset: () => set({ audioUrl: null, isAudioPlaying: false, currentTime: 0, duration: 0 }),
}));
