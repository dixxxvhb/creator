import { create } from 'zustand';

export type PlaybackMode = 'single' | 'sequence';

interface PlaybackState {
  isPlaying: boolean;
  isPaused: boolean;
  progress: number; // 0–1 within current transition
  currentTransitionIndex: number; // 0 = F1→F2, 1 = F2→F3, etc.
  totalTransitions: number;
  playbackSpeed: number;
  loopEnabled: boolean;
  mode: PlaybackMode;

  // Durations for each transition (indexed same as currentTransitionIndex)
  transitionDurations: number[];

  play: (totalTransitions: number, startIndex: number, durations: number[], mode?: PlaybackMode) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  setSpeed: (speed: number) => void;
  toggleLoop: () => void;
  tick: (deltaMs: number) => 'playing' | 'finished' | 'next-transition';
}

export const usePlaybackStore = create<PlaybackState>((set, get) => ({
  isPlaying: false,
  isPaused: false,
  progress: 0,
  currentTransitionIndex: 0,
  totalTransitions: 0,
  playbackSpeed: 1,
  loopEnabled: false,
  mode: 'sequence',
  transitionDurations: [],

  play: (totalTransitions, startIndex, durations, mode = 'sequence') => {
    if (totalTransitions <= 0) return;
    set({
      isPlaying: true,
      isPaused: false,
      progress: 0,
      currentTransitionIndex: startIndex,
      totalTransitions,
      transitionDurations: durations,
      mode,
    });
  },

  pause: () => set({ isPaused: true }),

  resume: () => set({ isPaused: false }),

  stop: () =>
    set({
      isPlaying: false,
      isPaused: false,
      progress: 0,
      currentTransitionIndex: 0,
    }),

  setSpeed: (speed) => set({ playbackSpeed: speed }),

  toggleLoop: () => set((s) => ({ loopEnabled: !s.loopEnabled })),

  tick: (deltaMs) => {
    const state = get();
    if (!state.isPlaying || state.isPaused) return 'playing';

    const idx = state.currentTransitionIndex;
    const duration = state.transitionDurations[idx] ?? 2000;
    const adjustedDelta = deltaMs * state.playbackSpeed;
    const progressDelta = adjustedDelta / duration;
    const newProgress = state.progress + progressDelta;

    if (newProgress >= 1) {
      // Transition complete
      const nextIdx = idx + 1;

      if (state.mode === 'single') {
        set({ isPlaying: false, isPaused: false, progress: 1 });
        return 'finished';
      }

      if (nextIdx >= state.totalTransitions) {
        // End of sequence
        if (state.loopEnabled) {
          set({ currentTransitionIndex: 0, progress: 0 });
          return 'next-transition';
        }
        set({ isPlaying: false, isPaused: false, progress: 1 });
        return 'finished';
      }

      set({ currentTransitionIndex: nextIdx, progress: 0 });
      return 'next-transition';
    }

    set({ progress: newProgress });
    return 'playing';
  },
}));
