import { useRef, useEffect, useMemo } from 'react';
import { usePlaybackStore } from '@/stores/playbackStore';
import { useFormationStore } from '@/stores/formationStore';
import type { PlaybackPosition, DancerPosition } from '@/types';

// ─── Easing Functions ───
function applyEasing(t: number, easing: string): number {
  switch (easing) {
    case 'linear':
      return t;
    case 'ease-in':
      return t * t;
    case 'ease-out':
      return 1 - (1 - t) * (1 - t);
    case 'ease-in-out':
      return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
    default:
      return t;
  }
}

// ─── Interpolate between two formation snapshots ───
function interpolatePositions(
  from: DancerPosition[],
  to: DancerPosition[],
  t: number,
  easing: string
): PlaybackPosition[] {
  const easedT = applyEasing(t, easing);

  // Build lookup by dancer_label
  const toMap = new Map(to.map((p) => [p.dancer_label, p]));

  const result: PlaybackPosition[] = [];
  const seen = new Set<string>();

  // Dancers present in 'from'
  for (const fp of from) {
    seen.add(fp.dancer_label);
    const tp = toMap.get(fp.dancer_label);
    if (tp) {
      // Present in both — interpolate position
      result.push({
        ...fp,
        x: fp.x + (tp.x - fp.x) * easedT,
        y: fp.y + (tp.y - fp.y) * easedT,
        color: tp.color, // use destination color
        opacity: 1,
      });
    } else {
      // Only in 'from' — fade out
      result.push({
        ...fp,
        opacity: 1 - easedT,
      });
    }
  }

  // Dancers only in 'to' — fade in
  for (const tp of to) {
    if (!seen.has(tp.dancer_label)) {
      result.push({
        ...tp,
        opacity: easedT,
      });
    }
  }

  return result;
}

// ─── Hook ───
export function usePlayback() {
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  const isPlaying = usePlaybackStore((s) => s.isPlaying);
  const isPaused = usePlaybackStore((s) => s.isPaused);
  const progress = usePlaybackStore((s) => s.progress);
  const currentTransitionIndex = usePlaybackStore((s) => s.currentTransitionIndex);
  const tick = usePlaybackStore((s) => s.tick);

  const formations = useFormationStore((s) => s.formations);
  const positions = useFormationStore((s) => s.positions);
  const setActiveFormation = useFormationStore((s) => s.setActiveFormation);

  // Compute which formation pair we're interpolating between
  const fromFormation = formations[currentTransitionIndex];
  const toFormation = formations[currentTransitionIndex + 1];

  const fromPositions = fromFormation ? positions[fromFormation.id] ?? [] : [];
  const toPositions = toFormation ? positions[toFormation.id] ?? [] : [];
  const easing = toFormation?.transition_easing ?? 'ease-in-out';

  // Interpolated positions for the current frame
  const interpolatedPositions: PlaybackPosition[] | null = useMemo(() => {
    if (!isPlaying && !isPaused) return null;
    if (!fromFormation || !toFormation) return null;
    return interpolatePositions(fromPositions, toPositions, progress, easing);
  }, [isPlaying, isPaused, fromFormation, toFormation, fromPositions, toPositions, progress, easing]);

  // Update active formation in thumbnail strip as playback advances
  useEffect(() => {
    if (!isPlaying && !isPaused) return;
    // Highlight the "from" formation during transition
    if (fromFormation) {
      setActiveFormation(fromFormation.id);
    }
  }, [isPlaying, isPaused, fromFormation, setActiveFormation]);

  // rAF loop
  useEffect(() => {
    if (!isPlaying || isPaused) {
      lastTimeRef.current = 0;
      return;
    }

    function frame(time: number) {
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = time;
      }
      const delta = time - lastTimeRef.current;
      lastTimeRef.current = time;

      const result = tick(delta);

      if (result === 'finished') {
        return;
      }

      rafRef.current = requestAnimationFrame(frame);
    }

    rafRef.current = requestAnimationFrame(frame);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [isPlaying, isPaused, tick]);

  // Helper to start playback
  function startPlayback(mode: 'single' | 'sequence' = 'sequence') {
    if (formations.length < 2) return;

    const activeId = useFormationStore.getState().activeFormationId;
    const activeIdx = formations.findIndex((f) => f.id === activeId);
    const startIdx = mode === 'sequence' ? 0 : Math.max(0, activeIdx);
    const totalTransitions = formations.length - 1;
    const durations = formations.slice(1).map((f) => f.transition_duration_ms ?? 2000);

    usePlaybackStore.getState().play(totalTransitions, startIdx, durations, mode);
  }

  return {
    isPlaying,
    isPaused,
    interpolatedPositions,
    startPlayback,
    pause: usePlaybackStore.getState().pause,
    resume: usePlaybackStore.getState().resume,
    stop: usePlaybackStore.getState().stop,
    setSpeed: usePlaybackStore.getState().setSpeed,
    toggleLoop: usePlaybackStore.getState().toggleLoop,
    playbackSpeed: usePlaybackStore((s) => s.playbackSpeed),
    loopEnabled: usePlaybackStore((s) => s.loopEnabled),
    progress,
    currentTransitionIndex,
    totalTransitions: usePlaybackStore((s) => s.totalTransitions),
  };
}
