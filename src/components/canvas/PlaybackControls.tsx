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
  canPlaySingle: boolean; // current formation has a next
  onPlay: () => void;
  onPlaySingle: () => void;
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
  canPlaySingle,
  onPlay,
  onPlaySingle,
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
      <div className="flex items-center gap-1">
        <button
          onClick={onPlaySingle}
          disabled={!canPlaySingle}
          title={canPlaySingle ? 'Play this transition only' : 'No next formation'}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
            canPlaySingle
              ? 'accent-bg-light accent-text hover:opacity-80'
              : 'bg-surface-secondary text-text-tertiary cursor-not-allowed'
          )}
        >
          <Play size={14} />
          Play
        </button>
        <button
          onClick={onPlay}
          disabled={!canPlay}
          title={canPlay ? 'Play all transitions' : 'Need 2+ formations'}
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors',
            canPlay
              ? 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary'
              : 'bg-surface-secondary text-text-tertiary cursor-not-allowed'
          )}
        >
          All
        </button>
      </div>
    );
  }

  // Full controls when playing/paused
  return (
    <div className="flex items-center gap-2 bg-surface-elevated/80 backdrop-blur-sm border border-border rounded-xl px-3 py-1.5">
      {/* Play/Pause */}
      <button
        onClick={isPaused ? onResume : onPause}
        className="p-1.5 rounded-lg accent-text hover:bg-[var(--color-accent-light)] transition-colors"
        title={isPaused ? 'Resume' : 'Pause'}
      >
        {isPaused ? <Play size={16} /> : <Pause size={16} />}
      </button>

      {/* Stop */}
      <button
        onClick={onStop}
        className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors"
        title="Stop"
      >
        <Square size={14} />
      </button>

      {/* Progress bar */}
      <div className="flex-1 min-w-[80px] max-w-[200px] mx-2">
        <div className="h-1.5 bg-border rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-[width] duration-75"
            style={{ backgroundColor: 'var(--color-accent)', width: `${overallProgress * 100}%` }}
          />
        </div>
        <div className="text-[10px] text-text-tertiary mt-0.5 text-center">
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
                ? 'accent-bg-light accent-text'
                : 'text-text-tertiary hover:text-text-primary'
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
            ? 'accent-bg-light accent-text'
            : 'text-text-tertiary hover:text-text-primary'
        )}
      >
        <Repeat size={14} />
      </button>
    </div>
  );
}
