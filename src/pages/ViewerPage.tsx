import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Stage, Layer, Circle, Text, Line, Rect } from 'react-konva';
import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
import { getShareByToken } from '@/services/pieceShares';
import { fetchPiece } from '@/services/pieces';
import { fetchFormations } from '@/services/formations';
import { fetchPositionsBatch } from '@/services/dancerPositions';
import { cn } from '@/lib/utils';
import type { Piece, Formation, DancerPosition, PieceShare } from '@/types';

export function ViewerPage() {
  const { token } = useParams<{ token: string }>();

  const [share, setShare] = useState<PieceShare | null>(null);
  const [piece, setPiece] = useState<Piece | null>(null);
  const [formations, setFormations] = useState<Formation[]>([]);
  const [positions, setPositions] = useState<Record<string, DancerPosition[]>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoPlaying, setAutoPlaying] = useState(false);
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  // Responsive container width
  useEffect(() => {
    function measure() {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    }
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  // Load data
  useEffect(() => {
    if (!token) {
      setError('Invalid share link.');
      setLoading(false);
      return;
    }

    async function load() {
      try {
        const shareData = await getShareByToken(token!);
        if (!shareData) {
          setError('This share link is invalid or has been revoked.');
          setLoading(false);
          return;
        }

        // Check expiration
        if (shareData.expires_at && new Date(shareData.expires_at) < new Date()) {
          setError('This share link has expired.');
          setLoading(false);
          return;
        }

        setShare(shareData);

        const [pieceData, formationData] = await Promise.all([
          fetchPiece(shareData.piece_id),
          fetchFormations(shareData.piece_id),
        ]);

        setPiece(pieceData);
        setFormations(formationData);

        if (formationData.length > 0) {
          const posData = await fetchPositionsBatch(formationData.map((f) => f.id));
          setPositions(posData);
        }
      } catch {
        setError('Failed to load piece data.');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [token]);

  // Navigation
  const goNext = useCallback(() => {
    setCurrentIndex((i) => Math.min(i + 1, formations.length - 1));
  }, [formations.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((i) => Math.max(i - 1, 0));
  }, []);

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        goNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goNext, goPrev]);

  // Auto-play
  useEffect(() => {
    if (autoPlaying) {
      autoPlayRef.current = setInterval(() => {
        setCurrentIndex((i) => {
          if (i >= formations.length - 1) {
            setAutoPlaying(false);
            return i;
          }
          return i + 1;
        });
      }, 2000);
    }
    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [autoPlaying, formations.length]);

  // Stop auto-play at end
  useEffect(() => {
    if (autoPlaying && currentIndex >= formations.length - 1) {
      setAutoPlaying(false);
    }
  }, [currentIndex, autoPlaying, formations.length]);

  function toggleAutoPlay() {
    if (autoPlaying) {
      setAutoPlaying(false);
    } else {
      if (currentIndex >= formations.length - 1) setCurrentIndex(0);
      setAutoPlaying(true);
    }
  }

  // --- Loading ---
  if (loading) {
    return (
      <div className="min-h-dvh bg-stone-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-stone-600 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  // --- Error ---
  if (error) {
    return (
      <div className="min-h-dvh bg-stone-950 flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <h1 className="text-xl font-semibold text-white mb-2">Unable to View</h1>
          <p className="text-stone-400 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!piece || !share) return null;

  const currentFormation = formations[currentIndex];
  const currentPositions = currentFormation ? (positions[currentFormation.id] ?? []) : [];

  const stageWidth = piece.stage_width ?? 1000;
  const stageDepth = piece.stage_depth ?? 600;
  const availableWidth = Math.min(containerWidth - 32, 800); // 16px padding each side, max 800
  const scale = availableWidth > 0 ? availableWidth / stageWidth : 0.5;
  const scaledWidth = stageWidth * scale;
  const scaledHeight = stageDepth * scale;

  const songText = [piece.song_title, piece.song_artist].filter(Boolean).join(' -- ');

  return (
    <div className="min-h-dvh bg-stone-950 flex flex-col text-white">
      {/* Header */}
      <header className="px-4 py-4 border-b border-stone-800 shrink-0">
        <h1 className="text-lg font-semibold text-center">{piece.title}</h1>
        {songText && (
          <p className="text-xs text-stone-500 text-center mt-0.5">{songText}</p>
        )}
      </header>

      {/* Stage area */}
      <div ref={containerRef} className="flex-1 flex items-center justify-center p-4">
        {formations.length === 0 ? (
          <p className="text-stone-500 text-sm">No formations in this piece.</p>
        ) : (
          <div>
            {/* Formation label */}
            <div className="text-center mb-3">
              <p className="text-base font-semibold">
                {currentFormation?.label ?? `Formation ${currentIndex + 1}`}
              </p>
              <p className="text-xs text-stone-500">
                {currentIndex + 1} of {formations.length}
              </p>
            </div>

            {/* Canvas */}
            <Stage
              width={scaledWidth}
              height={scaledHeight}
              scaleX={scale}
              scaleY={scale}
              style={{
                background: '#1c1917',
                borderRadius: '12px',
                border: '1px solid #44403c',
              }}
            >
              <Layer>
                {/* Stage border */}
                <Rect
                  x={0}
                  y={0}
                  width={stageWidth}
                  height={stageDepth}
                  stroke="#57534e"
                  strokeWidth={1}
                />
                {/* Center line */}
                <Line
                  points={[stageWidth / 2, 0, stageWidth / 2, stageDepth]}
                  stroke="#44403c"
                  strokeWidth={0.5}
                  dash={[6, 6]}
                />
                {/* Dancer dots */}
                {currentPositions.map((pos, i) => (
                  <React.Fragment key={i}>
                    <Circle
                      x={pos.x}
                      y={pos.y}
                      radius={20}
                      fill={pos.color}
                      opacity={0.9}
                      shadowColor={pos.color}
                      shadowBlur={10}
                      shadowOpacity={0.4}
                    />
                    <Text
                      x={pos.x - 18}
                      y={pos.y - 6}
                      width={36}
                      text={pos.dancer_label}
                      fontSize={12}
                      fill="white"
                      align="center"
                      fontStyle="bold"
                    />
                  </React.Fragment>
                ))}
              </Layer>
            </Stage>

            {/* Notes */}
            {currentFormation?.choreo_notes && (
              <div className="mt-3 px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 max-w-lg mx-auto">
                <p className="text-xs text-stone-400 whitespace-pre-wrap">
                  {currentFormation.choreo_notes}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom controls */}
      {formations.length > 0 && (
        <div className="border-t border-stone-800 px-4 py-4 shrink-0">
          <div className="flex items-center justify-center gap-4 max-w-md mx-auto">
            <button
              onClick={goPrev}
              disabled={currentIndex === 0}
              className="p-3 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 disabled:opacity-30 disabled:pointer-events-none transition-all min-h-[48px] min-w-[48px] flex items-center justify-center"
            >
              <ChevronLeft size={24} />
            </button>

            <button
              onClick={toggleAutoPlay}
              className={cn(
                'p-3 rounded-xl transition-all min-h-[48px] min-w-[48px] flex items-center justify-center',
                autoPlaying
                  ? 'bg-white text-stone-950'
                  : 'text-stone-400 hover:text-white hover:bg-stone-800',
              )}
            >
              {autoPlaying ? <Pause size={20} /> : <Play size={20} />}
            </button>

            <button
              onClick={goNext}
              disabled={currentIndex >= formations.length - 1}
              className="p-3 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 disabled:opacity-30 disabled:pointer-events-none transition-all min-h-[48px] min-w-[48px] flex items-center justify-center"
            >
              <ChevronRight size={24} />
            </button>
          </div>

          {/* Formation dots */}
          {formations.length > 1 && (
            <div className="flex items-center justify-center gap-1.5 mt-3 overflow-x-auto">
              {formations.map((_, i) => (
                <button
                  key={i}
                  onClick={() => { setAutoPlaying(false); setCurrentIndex(i); }}
                  className={cn(
                    'rounded-full transition-all duration-200 shrink-0',
                    i === currentIndex
                      ? 'w-6 h-2.5 bg-white'
                      : 'w-2.5 h-2.5 bg-stone-700 hover:bg-stone-500',
                  )}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
