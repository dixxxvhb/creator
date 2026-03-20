import { Play, Pause } from 'lucide-react';

interface AudioPlayerProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onToggle: () => void;
  onSeek: (time: number) => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function AudioPlayer({ isPlaying, currentTime, duration, onToggle, onSeek }: AudioPlayerProps) {
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  function handleScrub(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    onSeek(Math.max(0, Math.min(duration, x * duration)));
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={onToggle}
        className="w-8 h-8 rounded-full flex items-center justify-center accent-bg-light text-[var(--color-accent)] hover:opacity-80 transition-opacity shrink-0"
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
      </button>

      <span className="text-xs text-text-secondary font-mono w-10 shrink-0">
        {formatTime(currentTime)}
      </span>

      <div
        className="flex-1 h-2 bg-surface-secondary rounded-full cursor-pointer relative"
        onClick={handleScrub}
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            width: `${progress}%`,
            backgroundColor: 'var(--color-accent)',
          }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white shadow-sm"
          style={{
            left: `${progress}%`,
            transform: `translate(-50%, -50%)`,
            backgroundColor: 'var(--color-accent)',
          }}
        />
      </div>

      <span className="text-xs text-text-secondary font-mono w-10 shrink-0 text-right">
        {formatTime(duration)}
      </span>
    </div>
  );
}
