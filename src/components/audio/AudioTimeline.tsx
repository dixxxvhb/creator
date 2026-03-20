import { useRef, useState } from 'react';
import type { Formation } from '@/types';

interface AudioTimelineProps {
  formations: Formation[];
  duration: number;
  currentTime: number;
  activeFormationId: string | null;
  onSeek: (time: number) => void;
  onUpdateTimestamp: (formationId: string, timestamp: number) => void;
  onSelectFormation: (formationId: string) => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function AudioTimeline({
  formations,
  duration,
  currentTime,
  activeFormationId,
  onSeek,
  onUpdateTimestamp,
  onSelectFormation,
}: AudioTimelineProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<string | null>(null);

  if (duration <= 0) return null;

  const playheadPct = (currentTime / duration) * 100;

  function getTimeFromX(clientX: number): number {
    if (!barRef.current) return 0;
    const rect = barRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return pct * duration;
  }

  function handleBarClick(e: React.MouseEvent) {
    // Don't seek if clicking on a marker
    if ((e.target as HTMLElement).closest('[data-marker]')) return;
    onSeek(getTimeFromX(e.clientX));
  }

  function handleMarkerDown(formationId: string, e: React.MouseEvent | React.TouchEvent) {
    e.stopPropagation();
    setDragging(formationId);

    function handleMove(ev: MouseEvent | TouchEvent) {
      const clientX = 'touches' in ev ? ev.touches[0].clientX : ev.clientX;
      const time = getTimeFromX(clientX);
      onUpdateTimestamp(formationId, Math.round(time * 10) / 10);
    }

    function handleUp() {
      setDragging(null);
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleUp);
    }

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('touchend', handleUp);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[10px] text-text-tertiary font-mono">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>

      {/* Timeline bar */}
      <div
        ref={barRef}
        className="relative h-10 bg-surface-secondary rounded-lg cursor-pointer"
        onClick={handleBarClick}
      >
        {/* Playhead */}
        <div
          className="absolute top-0 bottom-0 w-0.5 z-20"
          style={{
            left: `${playheadPct}%`,
            backgroundColor: 'var(--color-accent)',
          }}
        />

        {/* Formation markers */}
        {formations.map((f, idx) => {
          const ts = f.timestamp_seconds;
          if (ts === null || ts === undefined) return null;
          const pct = (ts / duration) * 100;
          const isActive = f.id === activeFormationId;
          const isDragging = dragging === f.id;

          return (
            <div
              key={f.id}
              data-marker
              className={`absolute top-0 bottom-0 flex flex-col items-center justify-center cursor-grab select-none ${
                isDragging ? 'cursor-grabbing z-30' : 'z-10'
              }`}
              style={{ left: `${pct}%`, transform: 'translateX(-50%)' }}
              onMouseDown={(e) => handleMarkerDown(f.id, e)}
              onTouchStart={(e) => handleMarkerDown(f.id, e)}
              onClick={(e) => { e.stopPropagation(); onSelectFormation(f.id); }}
            >
              {/* Pin */}
              <div
                className={`w-3 h-full rounded-sm transition-colors ${
                  isActive
                    ? 'bg-[var(--color-accent)]'
                    : 'bg-text-tertiary/60 hover:bg-text-secondary'
                }`}
              />
              {/* Label */}
              <span
                className={`absolute -bottom-5 text-[9px] font-medium whitespace-nowrap ${
                  isActive ? 'text-[var(--color-accent)]' : 'text-text-tertiary'
                }`}
              >
                F{idx + 1}
              </span>
            </div>
          );
        })}
      </div>

      {/* Marker labels row (spacer for the F1, F2 labels) */}
      <div className="h-3" />
    </div>
  );
}
