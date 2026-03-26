import { useRef, useEffect, useCallback, useState } from 'react';
import { useWaveform } from '@/hooks/useWaveform';
import type { Formation } from '@/types';

interface WaveformTimelineProps {
  audioUrl: string;
  formations: Formation[];
  activeFormationId: string | null;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onSeek: (time: number) => void;
  onPlay: () => void;
  onPause: () => void;
  onUpdateTimestamp: (formationId: string, timestamp: number) => void;
  onSelectFormation: (id: string) => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function WaveformTimeline({
  audioUrl,
  formations,
  activeFormationId,
  currentTime,
  duration: externalDuration,
  isPlaying,
  onSeek,
  onPlay,
  onPause,
  onUpdateTimestamp,
  onSelectFormation,
}: WaveformTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<string | null>(null);

  // Read accent color from CSS
  const accentColor = getComputedStyle(document.documentElement)
    .getPropertyValue('--color-accent')
    .trim() || '#B4838D';

  const { isReady, seekTo, wavesurfer } = useWaveform({
    audioUrl,
    containerRef,
    waveColor: `${accentColor}55`,
    progressColor: accentColor,
    height: 80,
    onSeek: (time) => {
      onSeek(time);
    },
    onPlay: () => {
      onPlay();
    },
    onPause: () => {
      onPause();
    },
  });

  // Sync external play/pause state with wavesurfer
  useEffect(() => {
    if (!isReady || !wavesurfer.current) return;
    const ws = wavesurfer.current;
    if (isPlaying && !ws.isPlaying()) {
      ws.play();
    } else if (!isPlaying && ws.isPlaying()) {
      ws.pause();
    }
  }, [isPlaying, isReady, wavesurfer]);

  // Sync external seek to wavesurfer (only when not playing, to avoid jitter)
  useEffect(() => {
    if (!isReady || !wavesurfer.current || isPlaying) return;
    const ws = wavesurfer.current;
    const dur = ws.getDuration();
    if (dur > 0) {
      const wsCurrent = ws.getCurrentTime();
      // Only seek if difference is significant (avoids feedback loops)
      if (Math.abs(wsCurrent - currentTime) > 0.1) {
        seekTo(currentTime);
      }
    }
  }, [currentTime, isReady, isPlaying, seekTo, wavesurfer]);

  const duration = externalDuration > 0 ? externalDuration : 0;

  const getTimeFromX = useCallback(
    (clientX: number): number => {
      if (!overlayRef.current || duration <= 0) return 0;
      const rect = overlayRef.current.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      return pct * duration;
    },
    [duration],
  );

  function handleMarkerDown(formationId: string, e: React.MouseEvent | React.TouchEvent) {
    e.stopPropagation();
    e.preventDefault();
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

      {/* Waveform + overlay container */}
      <div className="relative rounded-lg overflow-hidden bg-surface-secondary">
        {/* Loading state */}
        {!isReady && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="text-xs text-text-tertiary">Loading waveform...</div>
          </div>
        )}

        {/* WaveSurfer renders here */}
        <div ref={containerRef} className="w-full" style={{ minHeight: 80 }} />

        {/* Formation cue overlay — sits on top of the waveform */}
        {duration > 0 && (
          <div ref={overlayRef} className="absolute inset-0 pointer-events-none z-10">
            {formations.map((f, idx) => {
              const ts = f.timestamp_seconds;
              if (ts === null || ts === undefined) return null;
              const pct = (ts / duration) * 100;
              const isActive = f.id === activeFormationId;
              const isDragging = dragging === f.id;

              return (
                <div
                  key={f.id}
                  className="absolute top-0 bottom-0 pointer-events-auto"
                  style={{
                    left: `${pct}%`,
                    transform: 'translateX(-50%)',
                    width: 20,
                  }}
                >
                  {/* Clickable / draggable hit area */}
                  <div
                    className={`absolute inset-0 flex flex-col items-center cursor-grab select-none ${
                      isDragging ? 'cursor-grabbing' : ''
                    }`}
                    onMouseDown={(e) => handleMarkerDown(f.id, e)}
                    onTouchStart={(e) => handleMarkerDown(f.id, e)}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectFormation(f.id);
                    }}
                  >
                    {/* Vertical line */}
                    <div
                      className="w-0.5 h-full"
                      style={{
                        backgroundColor: isActive ? accentColor : 'rgba(255,255,255,0.5)',
                      }}
                    />
                  </div>

                  {/* Label below */}
                  <span
                    className={`absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] font-medium whitespace-nowrap ${
                      isActive ? 'text-[var(--color-accent)]' : 'text-text-tertiary'
                    }`}
                  >
                    F{idx + 1}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Spacer for F labels below */}
      <div className="h-3" />
    </div>
  );
}
