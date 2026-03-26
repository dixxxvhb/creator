import { useRef, useEffect, useState, useCallback } from 'react';
import WaveSurfer from 'wavesurfer.js';

interface UseWaveformOptions {
  audioUrl: string | null;
  containerRef: React.RefObject<HTMLDivElement | null>;
  waveColor?: string;
  progressColor?: string;
  height?: number;
  onReady?: (duration: number) => void;
  onSeek?: (time: number) => void;
  onPlay?: () => void;
  onPause?: () => void;
}

export function useWaveform({
  audioUrl,
  containerRef,
  waveColor = '#888',
  progressColor = '#B4838D',
  height = 80,
  onReady,
  onSeek,
  onPlay,
  onPause,
}: UseWaveformOptions) {
  const wsRef = useRef<WaveSurfer | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Store callbacks in refs to avoid re-creating WaveSurfer on callback changes
  const onReadyRef = useRef(onReady);
  const onSeekRef = useRef(onSeek);
  const onPlayRef = useRef(onPlay);
  const onPauseRef = useRef(onPause);
  onReadyRef.current = onReady;
  onSeekRef.current = onSeek;
  onPlayRef.current = onPlay;
  onPauseRef.current = onPause;

  // Create / destroy WaveSurfer instance
  useEffect(() => {
    if (!audioUrl || !containerRef.current) {
      setIsReady(false);
      setCurrentTime(0);
      setDuration(0);
      return;
    }

    const container = containerRef.current;

    const ws = WaveSurfer.create({
      container,
      url: audioUrl,
      waveColor,
      progressColor,
      height,
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      cursorWidth: 1,
      cursorColor: 'var(--color-accent)',
      normalize: true,
      interact: true,
      hideScrollbar: true,
    });

    wsRef.current = ws;

    ws.on('ready', () => {
      const dur = ws.getDuration();
      setDuration(dur);
      setIsReady(true);
      onReadyRef.current?.(dur);
    });

    ws.on('timeupdate', (time: number) => {
      setCurrentTime(time);
    });

    ws.on('seeking', (time: number) => {
      setCurrentTime(time);
      onSeekRef.current?.(time);
    });

    ws.on('play', () => {
      onPlayRef.current?.();
    });

    ws.on('pause', () => {
      onPauseRef.current?.();
    });

    ws.on('finish', () => {
      onPauseRef.current?.();
    });

    return () => {
      ws.destroy();
      wsRef.current = null;
      setIsReady(false);
    };
    // Only recreate when URL or visual config changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioUrl, waveColor, progressColor, height]);

  const play = useCallback(() => {
    wsRef.current?.play();
  }, []);

  const pause = useCallback(() => {
    wsRef.current?.pause();
  }, []);

  const seekTo = useCallback((time: number) => {
    if (!wsRef.current) return;
    const dur = wsRef.current.getDuration();
    if (dur > 0) {
      wsRef.current.seekTo(time / dur); // seekTo takes 0-1
    }
  }, []);

  return {
    isReady,
    currentTime,
    duration,
    play,
    pause,
    seekTo,
    wavesurfer: wsRef,
  };
}
