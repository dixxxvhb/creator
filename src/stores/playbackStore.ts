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
  audioMode: boolean;
  /** Hold time remaining after final transition (ms) */
  holdTimeRemaining: number;
  /** When set, only this dancer moves — everyone else stays frozen */
  soloDancerLabel: string | null;

  // Durations for each transition (indexed same as currentTransitionIndex)
  transitionDurations: number[];

  play: (totalTransitions: number, startIndex: number, durations: number[], mode?: PlaybackMode, soloDancerLabel?: string | null) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  setSpeed: (speed: number) => void;
  toggleLoop: () => void;
  setAudioMode: (enabled: boolean) => void;
  tick: (deltaMs: number) => 'playing' | 'finished' | 'next-transition';
  tickAudio: (currentTime: number, timestamps: (number | null)[]) => void;
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
  audioMode: false,
  holdTimeRemaining: 0,
  soloDancerLabel: null,
  transitionDurations: [],

  play: (totalTransitions, startIndex, durations, mode = 'sequence', soloDancerLabel = null) => {
    if (totalTransitions <= 0) return;
    set({
      isPlaying: true,
      isPaused: false,
      progress: 0,
      currentTransitionIndex: startIndex,
      totalTransitions,
      transitionDurations: durations,
      holdTimeRemaining: 0,
      soloDancerLabel,
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
      holdTimeRemaining: 0,
      soloDancerLabel: null,
    }),

  setSpeed: (speed) => set({ playbackSpeed: speed }),

  toggleLoop: () => set((s) => ({ loopEnabled: !s.loopEnabled })),

  setAudioMode: (enabled) => set({ audioMode: enabled }),

  // Audio-driven tick: compute transition index + progress from audio currentTime
  tickAudio: (currentTime, timestamps) => {
    // Find which transition we're in based on timestamps
    // timestamps[i] = start time of formation i
    let transIdx = 0;
    let t = 0;

    for (let i = 0; i < timestamps.length - 1; i++) {
      const fromTs = timestamps[i];
      const toTs = timestamps[i + 1];
      if (fromTs === null || toTs === null) continue;

      if (currentTime >= fromTs && currentTime < toTs) {
        transIdx = i;
        t = (currentTime - fromTs) / (toTs - fromTs);
        break;
      }
      if (currentTime >= (toTs ?? 0)) {
        transIdx = i;
        t = 1;
      }
    }

    set({
      isPlaying: true,
      isPaused: false,
      currentTransitionIndex: transIdx,
      progress: Math.max(0, Math.min(1, t)),
    });
  },

  tick: (deltaMs) => {
    const state = get();
    if (!state.isPlaying || state.isPaused) return 'playing';

    // Holding on final formation before stopping
    if (state.holdTimeRemaining > 0) {
      const remaining = state.holdTimeRemaining - deltaMs * state.playbackSpeed;
      if (remaining <= 0) {
        set({ isPlaying: false, isPaused: false, progress: 1, holdTimeRemaining: 0 });
        return 'finished';
      }
      set({ holdTimeRemaining: remaining });
      return 'playing';
    }

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
        // End of sequence — hold final formation for 1 second
        if (state.loopEnabled) {
          set({ currentTransitionIndex: 0, progress: 0 });
          return 'next-transition';
        }
        set({ progress: 1, holdTimeRemaining: 1000 });
        return 'playing';
      }

      set({ currentTransitionIndex: nextIdx, progress: 0 });
      return 'next-transition';
    }

    set({ progress: newProgress });
    return 'playing';
  },
}));
