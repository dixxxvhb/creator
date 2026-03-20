import { useRef, useEffect, useCallback } from 'react';
import { useAudioStore } from '@/stores/audioStore';

export function useAudioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number>(0);

  const audioUrl = useAudioStore((s) => s.audioUrl);
  const isAudioPlaying = useAudioStore((s) => s.isAudioPlaying);
  const currentTime = useAudioStore((s) => s.currentTime);
  const duration = useAudioStore((s) => s.duration);
  const setPlaying = useAudioStore((s) => s.setPlaying);
  const setCurrentTime = useAudioStore((s) => s.setCurrentTime);
  const setDuration = useAudioStore((s) => s.setDuration);

  // Create/destroy Audio element when URL changes
  useEffect(() => {
    if (!audioUrl) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      return;
    }

    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    audio.addEventListener('loadedmetadata', () => {
      setDuration(audio.duration);
    });

    audio.addEventListener('ended', () => {
      setPlaying(false);
      cancelAnimationFrame(rafRef.current);
    });

    return () => {
      audio.pause();
      audio.src = '';
      cancelAnimationFrame(rafRef.current);
    };
  }, [audioUrl, setDuration, setPlaying]);

  // rAF loop for smooth currentTime updates during playback
  useEffect(() => {
    if (!isAudioPlaying || !audioRef.current) {
      cancelAnimationFrame(rafRef.current);
      return;
    }

    function tick() {
      if (audioRef.current) {
        setCurrentTime(audioRef.current.currentTime);
      }
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafRef.current);
  }, [isAudioPlaying, setCurrentTime]);

  const play = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.play();
    setPlaying(true);
  }, [setPlaying]);

  const pause = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    setPlaying(false);
  }, [setPlaying]);

  const seek = useCallback((time: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  }, [setCurrentTime]);

  const toggle = useCallback(() => {
    if (isAudioPlaying) pause();
    else play();
  }, [isAudioPlaying, play, pause]);

  return {
    isAudioPlaying,
    currentTime,
    duration,
    play,
    pause,
    seek,
    toggle,
    hasAudio: audioUrl !== null,
  };
}
