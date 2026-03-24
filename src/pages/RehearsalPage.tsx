import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, ChevronLeft, ChevronRight,
  StickyNote, X,
} from 'lucide-react';
import { Stage, Layer, Circle, Text, Line, Rect } from 'react-konva';
import { useFormationStore } from '@/stores/formationStore';
import { usePieceStore } from '@/stores/pieceStore';
import { Spinner } from '@/components/ui/Spinner';
import { cn } from '@/lib/utils';

export function RehearsalPage() {
  const { id: pieceId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const piece = usePieceStore((s) => s.getById(pieceId ?? ''));
  const loadPieces = usePieceStore((s) => s.load);
  const formations = useFormationStore((s) => s.formations);
  const positions = useFormationStore((s) => s.positions);
  const isLoading = useFormationStore((s) => s.isLoading);
  const loadFormations = useFormationStore((s) => s.load);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showNotes, setShowNotes] = useState(false);

  useEffect(() => {
    if (pieceId) {
      loadFormations(pieceId);
      loadPieces();
    }
  }, [pieceId, loadFormations, loadPieces]);

  const currentFormation = formations[currentIndex];
  const currentPositions = currentFormation ? (positions[currentFormation.id] ?? []) : [];

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
      } else if (e.key === 'Escape') {
        navigate(`/pieces/${pieceId}`);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goNext, goPrev, navigate, pieceId]);

  if (isLoading) {
    return (
      <div className="min-h-dvh bg-surface flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const stageWidth = piece?.stage_width ?? 800;
  const stageDepth = piece?.stage_depth ?? 600;

  // Scale to fit viewport
  const viewWidth = typeof window !== 'undefined' ? window.innerWidth - 48 : 800;
  const viewHeight = typeof window !== 'undefined' ? window.innerHeight - 200 : 600;
  const scale = Math.min(viewWidth / stageWidth, viewHeight / stageDepth, 1);
  const scaledWidth = stageWidth * scale;
  const scaledHeight = stageDepth * scale;

  return (
    <div className="min-h-dvh bg-surface flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border-light shrink-0">
        <button
          onClick={() => navigate(`/pieces/${pieceId}`)}
          className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors min-h-[44px]"
        >
          <ArrowLeft size={18} />
          <span className="hidden sm:inline">Back to Editor</span>
        </button>
        <div className="text-center">
          <h1 className="font-display text-base font-semibold text-text-primary">
            {piece?.title ?? 'Rehearsal'}
          </h1>
          <p className="text-xs text-text-tertiary">
            Rehearsal Mode
          </p>
        </div>
        <button
          onClick={() => setShowNotes(!showNotes)}
          className={cn(
            'p-2.5 rounded-xl transition-all min-h-[44px] min-w-[44px] flex items-center justify-center',
            showNotes ? 'accent-bg-light accent-text' : 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary',
          )}
        >
          <StickyNote size={18} />
        </button>
      </header>

      {/* Stage area */}
      <div className="flex-1 flex items-center justify-center p-4 relative">
        {formations.length === 0 ? (
          <div className="text-center">
            <p className="text-text-secondary">No formations to rehearse.</p>
            <button
              onClick={() => navigate(`/pieces/${pieceId}`)}
              className="text-sm accent-text mt-2 hover:opacity-80"
            >
              Go to editor
            </button>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentFormation?.id}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.2 }}
              className="relative"
            >
              <Stage
                width={scaledWidth}
                height={scaledHeight}
                scaleX={scale}
                scaleY={scale}
                className="rounded-2xl overflow-hidden"
                style={{ background: 'var(--color-surface-secondary)' }}
              >
                <Layer>
                  {/* Stage border */}
                  <Rect
                    x={0}
                    y={0}
                    width={stageWidth}
                    height={stageDepth}
                    stroke="#D6D3D1"
                    strokeWidth={1}
                  />
                  {/* Center line */}
                  <Line
                    points={[stageWidth / 2, 0, stageWidth / 2, stageDepth]}
                    stroke="#E7E5E4"
                    strokeWidth={0.5}
                    dash={[4, 4]}
                  />
                  {/* Dancer dots */}
                  {currentPositions.map((pos, i) => (
                    <React.Fragment key={i}>
                      <Circle
                        x={pos.x}
                        y={pos.y}
                        radius={18}
                        fill={pos.color}
                        opacity={0.9}
                        shadowColor={pos.color}
                        shadowBlur={8}
                        shadowOpacity={0.3}
                      />
                      <Text
                        x={pos.x - 14}
                        y={pos.y - 6}
                        width={28}
                        text={pos.dancer_label}
                        fontSize={11}
                        fill="white"
                        align="center"
                        fontStyle="bold"
                      />
                    </React.Fragment>
                  ))}
                </Layer>
              </Stage>
            </motion.div>
          </AnimatePresence>
        )}

        {/* Notes overlay */}
        {showNotes && currentFormation && (
          <div className="absolute bottom-4 left-4 right-4 max-w-lg mx-auto bg-surface-elevated/95 backdrop-blur-sm rounded-2xl border border-border-light shadow-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-text-tertiary uppercase tracking-wide">Notes</span>
              <button onClick={() => setShowNotes(false)} className="text-text-tertiary hover:text-text-secondary">
                <X size={14} />
              </button>
            </div>
            {currentFormation.choreo_notes ? (
              <p className="text-sm text-text-primary whitespace-pre-wrap">{currentFormation.choreo_notes}</p>
            ) : (
              <p className="text-sm text-text-tertiary italic">No notes for this formation.</p>
            )}
            {currentFormation.counts_notes && (
              <p className="text-xs text-text-secondary mt-2 font-mono">{currentFormation.counts_notes}</p>
            )}
          </div>
        )}
      </div>

      {/* Bottom controls */}
      <div className="border-t border-border-light px-4 py-4 shrink-0 safe-bottom">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <button
            onClick={goPrev}
            disabled={currentIndex === 0}
            className="p-3 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-secondary disabled:opacity-30 disabled:pointer-events-none transition-all min-h-[48px] min-w-[48px] flex items-center justify-center"
          >
            <ChevronLeft size={24} />
          </button>

          <div className="text-center">
            <p className="font-display text-lg font-semibold text-text-primary">
              {currentFormation?.label ?? `Formation ${currentIndex + 1}`}
            </p>
            <p className="text-xs text-text-tertiary">
              {currentIndex + 1} of {formations.length}
            </p>
          </div>

          <button
            onClick={goNext}
            disabled={currentIndex >= formations.length - 1}
            className="p-3 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-secondary disabled:opacity-30 disabled:pointer-events-none transition-all min-h-[48px] min-w-[48px] flex items-center justify-center"
          >
            <ChevronRight size={24} />
          </button>
        </div>

        {/* Formation thumbnails */}
        {formations.length > 1 && (
          <div className="flex items-center justify-center gap-1.5 mt-3 overflow-x-auto scrollbar-none">
            {formations.map((f, i) => (
              <button
                key={f.id}
                onClick={() => setCurrentIndex(i)}
                className={cn(
                  'w-2.5 h-2.5 rounded-full transition-all duration-200 shrink-0',
                  i === currentIndex
                    ? 'w-8 accent-bg'
                    : 'bg-border hover:bg-text-tertiary',
                )}
                style={i === currentIndex ? { backgroundColor: 'var(--color-accent)' } : undefined}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Need React in scope for react-konva Fragments
import React from 'react';
