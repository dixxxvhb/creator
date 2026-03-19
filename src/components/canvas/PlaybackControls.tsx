import { Play, Pause, Square, Repeat } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlaybackControlsProps {
  isPlaying: boolean;
  isPaused: boolean;
  playbackSpeed: number;
  loopEnabled: boolean;
  progress: number;
  currentTransitionIndex: number;
  totalTransitions: number;
  canPlay: boolean; // needs 2+ formations
  onPlay: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onSetSpeed: (speed: number) => void;
  onToggleLoop: () => void;
}

const SPEEDS = [0.5, 1, 1.5, 2];

export function PlaybackControls({
  isPlaying,
  isPaused,
  playbackSpeed,
  loopEnabled,
  progress,
  currentTransitionIndex,
  totalTransitions,
  canPlay,
  onPlay,
  onPause,
  onResume,
  onStop,
  onSetSpeed,
  onToggleLoop,
}: PlaybackControlsProps) {
  const active = isPlaying || isPaused;

  // Overall progress across all transitions
  const overallProgress =
    totalTransitions > 0
      ? (currentTransitionIndex + progress) / totalTransitions
      : 0;

  if (!active) {
    // Compact idle state — just a play button
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={onPlay}
          disabled={!canPlay}
          title={canPlay ? 'Play transitions' : 'Need 2+ formations to play'}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
            canPlay
              ? 'bg-electric-500/20 text-electric-400 hover:bg-electric-500/30'
              : 'bg-slate-800/50 text-slate-600 cursor-not-allowed'
          )}
        >
          <Play size={14} />
          Play
        </button>
      </div>
    );
  }

  // Full controls when playing/paused
  return (
    <div className="flex items-center gap-2 bg-slate-800/80 backdrop-blur-sm border border-slate-700 rounded-xl px-3 py-1.5">
      {/* Play/Pause */}
      <button
        onClick={isPaused ? onResume : onPause}
        className="p-1.5 rounded-lg text-electric-400 hover:bg-electric-500/20 transition-colors"
        title={isPaused ? 'Resume' : 'Pause'}
      >
        {isPaused ? <Play size={16} /> : <Pause size={16} />}
      </button>

      {/* Stop */}
      <button
        onClick={onStop}
        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 transition-colors"
        title="Stop"
      >
        <Square size={14} />
      </button>

      {/* Progress bar */}
      <div className="flex-1 min-w-[80px] max-w-[200px] mx-2">
        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-electric-500 rounded-full transition-[width] duration-75"
            style={{ width: `${overallProgress * 100}%` }}
          />
        </div>
        <div className="text-[10px] text-slate-500 mt-0.5 text-center">
          {currentTransitionIndex + 1} / {totalTransitions}
        </div>
      </div>

      {/* Speed selector */}
      <div className="flex items-center gap-0.5">
        {SPEEDS.map((speed) => (
          <button
            key={speed}
            onClick={() => onSetSpeed(speed)}
            className={cn(
              'px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors',
              playbackSpeed === speed
                ? 'bg-electric-500/20 text-electric-400'
                : 'text-slate-500 hover:text-slate-300'
            )}
          >
            {speed}x
          </button>
        ))}
      </div>

      {/* Loop toggle */}
      <button
        onClick={onToggleLoop}
        title="Loop"
        className={cn(
          'p-1.5 rounded-lg transition-colors',
          loopEnabled
            ? 'bg-electric-500/20 text-electric-400'
            : 'text-slate-500 hover:text-slate-300'
        )}
      >
        <Repeat size={14} />
      </button>
    </div>
  );
}
