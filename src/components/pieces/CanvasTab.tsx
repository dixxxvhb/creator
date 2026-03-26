import { useRef, type RefObject } from 'react';
import { FormationCanvas, ThumbnailStrip, CanvasToolbar, PlaybackControls } from '@/components/canvas';
import type { FormationCanvasHandle } from '@/components/canvas';
import { Spinner } from '@/components/ui/Spinner';
import { CanvasTutorial } from '@/components/onboarding/CanvasTutorial';
import { useUIStore } from '@/stores/uiStore';
import { useFormationStore } from '@/stores/formationStore';
import { usePathStore } from '@/stores/pathStore';
import { usePlaybackStore } from '@/stores/playbackStore';
import { useRosterStore } from '@/stores/rosterStore';
import { smartSnapPositions } from '@/lib/smartSnap';
import type { Piece, DancerPosition, Formation } from '@/types';

interface CanvasTabProps {
  piece: Piece;
  canvasRef: RefObject<FormationCanvasHandle | null>;
  zoom: number;
  onZoomChange: (z: number) => void;
  quickStartDismissed: boolean;
  onDismissQuickStart: () => void;
  // Playback
  isPlaying: boolean;
  isPaused: boolean;
  interpolatedPositions: import('@/types').PlaybackPosition[] | null;
  playbackSpeed: number;
  loopEnabled: boolean;
  playbackProgress: number;
  currentTransitionIndex: number;
  totalTransitions: number;
  startPlayback: (mode: 'sequence' | 'single') => void;
  pausePlayback: () => void;
  resumePlayback: () => void;
  stopPlayback: () => void;
  setSpeed: (s: number) => void;
  toggleLoop: () => void;
  // Handlers from useFormationEditor
  onAddFormation: () => void;
  onDeleteFormation: () => void;
  onRemoveDancer: (label?: string) => void;
  onQuickPopulate: (count: number) => void;
  // Modal openers
  onOpenTemplates: () => void;
  onOpenAddDancer: () => void;
  onShowShortcuts: () => void;
  // Thumbnail strip handlers
  onUpdateFormation: (id: string, updates: Partial<Formation>) => Promise<void>;
  // Undo/Redo
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
}

export function CanvasTab({
  piece,
  canvasRef,
  zoom,
  onZoomChange,
  quickStartDismissed,
  onDismissQuickStart,
  isPlaying,
  isPaused,
  interpolatedPositions,
  playbackSpeed,
  loopEnabled,
  playbackProgress,
  currentTransitionIndex,
  totalTransitions,
  startPlayback,
  pausePlayback,
  resumePlayback,
  stopPlayback,
  setSpeed,
  toggleLoop,
  onAddFormation,
  onDeleteFormation,
  onRemoveDancer,
  onQuickPopulate,
  onOpenTemplates,
  onOpenAddDancer,
  onShowShortcuts,
  onUpdateFormation,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}: CanvasTabProps) {
  const quickPopulateRef = useRef<HTMLInputElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const thumbnailRef = useRef<HTMLDivElement>(null);

  const showGrid = useUIStore((s) => s.showGrid);
  const snapToGrid = useUIStore((s) => s.snapToGrid);
  const showStageNumbers = useUIStore((s) => s.showStageNumbers);
  const canvasMode = useUIStore((s) => s.canvasMode);
  const audiencePosition = useUIStore((s) => s.audiencePosition);
  const showComparison = useUIStore((s) => s.showComparison);
  const toggleComparison = useUIStore((s) => s.toggleComparison);
  const toggleGrid = useUIStore((s) => s.toggleGrid);
  const toggleSnap = useUIStore((s) => s.toggleSnap);
  const toggleStageNumbers = useUIStore((s) => s.toggleStageNumbers);
  const setCanvasMode = useUIStore((s) => s.setCanvasMode);
  const setAudiencePosition = useUIStore((s) => s.setAudiencePosition);

  const formations = useFormationStore((s) => s.formations);
  const positions = useFormationStore((s) => s.positions);
  const activeFormationId = useFormationStore((s) => s.activeFormationId);
  const setActiveFormation = useFormationStore((s) => s.setActiveFormation);
  const formationsLoading = useFormationStore((s) => s.isLoading);
  const goNext = useFormationStore((s) => s.goNext);
  const goPrev = useFormationStore((s) => s.goPrev);
  const reorderFormations = useFormationStore((s) => s.reorderFormations);
  const updateLocalPosition = useFormationStore((s) => s.updateLocalPosition);

  const allPaths = usePathStore((s) => s.paths);
  const selectedPath = usePathStore((s) => s.selectedPath);
  const removePath = usePathStore((s) => s.removePath);

  const rosterDancers = useRosterStore((s) => s.dancers);

  const activeFormation = formations.find((f) => f.id === activeFormationId);
  const activePositions = activeFormationId ? positions[activeFormationId] ?? [] : [];

  const activeIdx = formations.findIndex((f) => f.id === activeFormationId);
  const canGoPrev = activeIdx > 0;
  const canGoNext = activeIdx >= 0 && activeIdx + 1 < formations.length;

  return (
    <div className="flex flex-col gap-4 min-w-0">
      {/* Canvas area */}
      <div className="flex-1 flex flex-col gap-3 min-w-0">
        {/* Toolbar */}
        <div ref={toolbarRef} className="flex items-center justify-between gap-2 flex-wrap min-w-0">
          <CanvasToolbar
            showGrid={showGrid}
            snapToGrid={snapToGrid}
            showStageNumbers={showStageNumbers}
            zoom={zoom}
            canGoPrev={canGoPrev && !isPlaying}
            canGoNext={canGoNext && !isPlaying}
            canvasMode={canvasMode}
            hasSelectedPath={selectedPath != null}
            dancerCount={piece.dancer_count}
            audiencePosition={audiencePosition}
            onOpenTemplates={onOpenTemplates}
            onToggleGrid={toggleGrid}
            onToggleSnap={() => {
              const wasSnapped = snapToGrid;
              toggleSnap();
              if (!wasSnapped && activeFormationId && activePositions.length > 0) {
                const updates = smartSnapPositions(
                  activePositions as DancerPosition[],
                  piece.stage_width,
                  piece.stage_depth,
                );
                for (const { id, x, y } of updates) {
                  const orig = activePositions.find((p) => p.id === id);
                  if (orig && (x !== orig.x || y !== orig.y)) {
                    updateLocalPosition(activeFormationId, id, x, y);
                  }
                }
              }
            }}
            onToggleStageNumbers={toggleStageNumbers}
            onZoomIn={() => canvasRef.current?.zoomIn()}
            onZoomOut={() => canvasRef.current?.zoomOut()}
            onZoomReset={() => canvasRef.current?.zoomReset()}
            onPrev={goPrev}
            onNext={goNext}
            onSetCanvasMode={(mode) => {
              const pathState = usePathStore.getState();
              if (pathState.isDrawing) {
                if (pathState.drawingPoints.length >= 2 && activeFormationId) {
                  pathState.finishDrawing(activeFormationId, 'freehand');
                } else {
                  pathState.cancelDrawing();
                }
              }
              setCanvasMode(mode);
            }}
            onDeletePath={() => {
              if (selectedPath && activeFormationId) {
                removePath(activeFormationId, selectedPath.dancerLabel);
              }
            }}
            onAddDancer={onOpenAddDancer}
            onRemoveDancer={() => onRemoveDancer()}
            onToggleAudiencePosition={() => setAudiencePosition(audiencePosition === 'top' ? 'bottom' : 'top')}
            showComparison={showComparison}
            canCompare={formations.length >= 2}
            onToggleComparison={toggleComparison}
            onShowShortcuts={onShowShortcuts}
            canUndo={canUndo}
            canRedo={canRedo}
            onUndo={onUndo}
            onRedo={onRedo}
          />
          {activeFormation && (
            <span className="text-sm text-text-secondary font-medium">
              {activeFormation.label || `Formation ${activeIdx + 1}`}
            </span>
          )}
        </div>

        {/* Formation Canvas — fills viewport minus header/tabs/toolbar/thumbnails */}
        <div ref={canvasContainerRef} className="w-full h-[max(300px,calc(100dvh-320px))] relative">
          <FormationCanvas ref={canvasRef} piece={piece} playbackPositions={interpolatedPositions} onZoomChange={onZoomChange} />
          {/* Playback controls */}
          <div className="absolute top-2 left-2 z-10">
            <PlaybackControls
              isPlaying={isPlaying}
              isPaused={isPaused}
              playbackSpeed={playbackSpeed}
              loopEnabled={loopEnabled}
              progress={playbackProgress}
              currentTransitionIndex={currentTransitionIndex}
              totalTransitions={totalTransitions}
              canPlay={formations.length >= 2}
              canPlaySingle={canGoNext}
              onPlay={() => startPlayback('sequence')}
              onPlaySingle={() => startPlayback('single')}
              onPause={pausePlayback}
              onResume={resumePlayback}
              onStop={stopPlayback}
              onSetSpeed={setSpeed}
              onToggleLoop={toggleLoop}
            />
          </div>
          {/* Empty state overlay when no dancers */}
          {piece.dancer_count === 0 && activePositions.length === 0 && !quickStartDismissed && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="pointer-events-auto bg-surface-elevated/95 backdrop-blur-sm border border-border rounded-2xl p-8 max-w-sm text-center space-y-4 shadow-lg">
                <p className="text-lg font-semibold text-text-primary">Add dancers to get started</p>
                <p className="text-sm text-text-secondary">
                  Use the toolbar to add dancers, then drag them into position.
                </p>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={onOpenAddDancer}
                    className="w-full px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-text-primary hover:bg-surface-secondary/50 transition-colors"
                  >
                    Add Dancer
                  </button>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={30}
                      defaultValue={8}
                      ref={quickPopulateRef}
                      className="flex-1 text-sm bg-surface-secondary border border-border rounded-xl px-3 py-2.5 text-text-primary text-center font-mono"
                    />
                    <button
                      onClick={async () => {
                        const count = Math.max(1, Math.min(30, parseInt(quickPopulateRef.current?.value ?? '') || 8));
                        await onQuickPopulate(count);
                      }}
                      className="flex-[2] px-4 py-2.5 rounded-xl accent-bg-light accent-text text-sm font-medium hover:brightness-105 transition-all"
                    >
                      Start with dancers
                    </button>
                  </div>
                </div>
                <div className="pt-2 border-t border-border space-y-3">
                  <p className="text-xs text-text-tertiary">
                    Press <kbd className="inline-flex items-center justify-center min-w-[20px] px-1.5 py-0.5 rounded bg-surface-secondary text-text-secondary text-[10px] font-mono border border-border">?</kbd> for keyboard shortcuts
                  </p>
                  <button
                    onClick={onDismissQuickStart}
                    className="text-xs text-text-tertiary hover:text-text-secondary transition-colors"
                  >
                    Got it
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Thumbnail strip */}
        <div ref={thumbnailRef}>
        {formationsLoading ? (
          <div className="flex justify-center py-4">
            <Spinner />
          </div>
        ) : (
          <ThumbnailStrip
            piece={piece}
            formations={formations}
            positions={positions}
            paths={allPaths}
            rosterDancers={rosterDancers}
            activeFormationId={activeFormationId}
            onSelect={setActiveFormation}
            onAdd={onAddFormation}
            onDelete={onDeleteFormation}
            onReorder={(orderedIds) => {
              reorderFormations(piece.id, orderedIds);
            }}
            onDeletePath={(fId, label) => removePath(fId, label)}
            onDeleteAllPaths={(fId) => {
              const fPaths = allPaths[fId] ?? [];
              for (const p of fPaths) removePath(fId, p.dancer_label);
            }}
            onEditPath={(fId, label) => {
              setActiveFormation(fId);
              removePath(fId, label);
              setCanvasMode('draw-freehand');
            }}
            onPlayPath={(fId, dancerLabel) => {
              setActiveFormation(fId);
              const idx = formations.findIndex((f) => f.id === fId);
              if (idx >= 0 && idx < formations.length - 1) {
                const durations = formations.slice(1).map((f) => f.transition_duration_ms ?? 2000);
                usePlaybackStore.getState().play(formations.length - 1, idx, durations, 'single', dancerLabel);
              }
            }}
            onUpdateTransition={(fId, updates) => onUpdateFormation(fId, updates)}
            bpm={piece.bpm}
          />
        )}
        </div>
      </div>

      {/* One-time canvas tutorial */}
      <CanvasTutorial
        toolbarRef={toolbarRef}
        canvasRef={canvasContainerRef}
        thumbnailRef={thumbnailRef}
      />
    </div>
  );
}
