import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Music, Users, Pencil, Check, X, Clock, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { PageContainer } from '@/components/layout';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import { FormationCanvas, ThumbnailStrip, CanvasToolbar, PlaybackControls } from '@/components/canvas';
import { usePlayback } from '@/hooks/usePlayback';
import { EASING_OPTIONS } from '@/types';
import { usePieceStore } from '@/stores/pieceStore';
import { useFormationStore } from '@/stores/formationStore';
import { useUIStore } from '@/stores/uiStore';
import { usePathStore } from '@/stores/pathStore';
import { useRosterStore } from '@/stores/rosterStore';
import { computeAverageAge } from '@/lib/age';
import type { DancerPositionInsert, EasingType } from '@/types';

export function PieceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const pieces = usePieceStore((s) => s.pieces);
  const loadPieces = usePieceStore((s) => s.load);
  const updatePiece = usePieceStore((s) => s.update);

  const formations = useFormationStore((s) => s.formations);
  const positions = useFormationStore((s) => s.positions);
  const activeFormationId = useFormationStore((s) => s.activeFormationId);
  const loadFormations = useFormationStore((s) => s.load);
  const updateFormation = useFormationStore((s) => s.updateFormation);
  const savePositions = useFormationStore((s) => s.savePositions);
  const setActiveFormation = useFormationStore((s) => s.setActiveFormation);
  const formationsLoading = useFormationStore((s) => s.isLoading);

  const addFormation = useFormationStore((s) => s.addFormation);
  const goNext = useFormationStore((s) => s.goNext);
  const goPrev = useFormationStore((s) => s.goPrev);

  const showGrid = useUIStore((s) => s.showGrid);
  const snapToGrid = useUIStore((s) => s.snapToGrid);
  const canvasMode = useUIStore((s) => s.canvasMode);
  const toggleGrid = useUIStore((s) => s.toggleGrid);
  const toggleSnap = useUIStore((s) => s.toggleSnap);
  const setCanvasMode = useUIStore((s) => s.setCanvasMode);

  const allPaths = usePathStore((s) => s.paths);
  const selectedPath = usePathStore((s) => s.selectedPath);
  const loadPaths = usePathStore((s) => s.loadPaths);
  const removePath = usePathStore((s) => s.removePath);

  const rosterDancers = useRosterStore((s) => s.dancers);
  const loadRoster = useRosterStore((s) => s.load);
  const updateLocalPositionDancer = useFormationStore((s) => s.updateLocalPositionDancer);

  const {
    isPlaying,
    isPaused,
    interpolatedPositions,
    startPlayback,
    pause: pausePlayback,
    resume: resumePlayback,
    stop: stopPlayback,
    setSpeed,
    toggleLoop,
    playbackSpeed,
    loopEnabled,
    progress: playbackProgress,
    currentTransitionIndex,
    totalTransitions,
  } = usePlayback();

  const [transitionOpen, setTransitionOpen] = useState(true);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [zoom, setZoom] = useState(1);

  const piece = pieces.find((p) => p.id === id);
  const activeFormation = formations.find((f) => f.id === activeFormationId);
  const activePositions = activeFormationId ? positions[activeFormationId] ?? [] : [];

  useEffect(() => {
    if (pieces.length === 0) loadPieces();
  }, [pieces.length, loadPieces]);

  useEffect(() => {
    if (id) loadFormations(id);
    return () => {
      useFormationStore.getState().reset();
      usePathStore.getState().reset();
    };
  }, [id, loadFormations]);

  // Load paths when formations are available
  useEffect(() => {
    if (formations.length > 0) {
      loadPaths(formations.map((f) => f.id));
    }
  }, [formations, loadPaths]);

  // Load roster dancers for assignment dropdowns
  useEffect(() => {
    if (rosterDancers.length === 0) loadRoster();
  }, [rosterDancers.length, loadRoster]);

  function handleTitleEdit() {
    if (!piece) return;
    setEditTitle(piece.title);
    setIsEditingTitle(true);
  }

  async function handleTitleSave() {
    if (!piece || !editTitle.trim()) return;
    await updatePiece(piece.id, { title: editTitle.trim() });
    setIsEditingTitle(false);
  }

  function handleTitleCancel() {
    setIsEditingTitle(false);
    setEditTitle('');
  }

  const activeIdx = formations.findIndex((f) => f.id === activeFormationId);
  const canGoPrev = activeIdx > 0;
  const canGoNext = activeIdx >= 0 && activeIdx + 1 < formations.length;

  async function handleAddFormation() {
    if (!id) return;
    const label = `Formation ${formations.length + 1}`;
    await addFormation({
      piece_id: id,
      index: formations.length,
      label,
      timestamp_seconds: null,
      choreo_notes: '',
      counts_notes: '',
      transition_duration_ms: 2000,
      transition_easing: 'ease-in-out',
    });
  }

  async function handleSavePositions() {
    if (!activeFormationId) return;
    setIsSaving(true);
    const inserts: DancerPositionInsert[] = activePositions.map((pos) => ({
      formation_id: activeFormationId,
      dancer_id: pos.dancer_id,
      dancer_label: pos.dancer_label,
      x: pos.x,
      y: pos.y,
      color: pos.color,
    }));
    await savePositions(activeFormationId, inserts);
    setIsSaving(false);
  }

  if (!piece && !formationsLoading) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-slate-400 mb-4">Piece not found</p>
          <Button variant="secondary" onClick={() => navigate('/pieces')}>
            <ArrowLeft size={16} />
            Back to Pieces
          </Button>
        </div>
      </PageContainer>
    );
  }

  if (!piece) {
    return (
      <PageContainer>
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      </PageContainer>
    );
  }

  const songText =
    piece.song_title || piece.song_artist
      ? [piece.song_title, piece.song_artist].filter(Boolean).join(' — ')
      : null;

  // Average age from assigned dancers across all formations
  const assignedDancerIds = new Set(
    Object.values(positions).flat().map((p) => p.dancer_id).filter(Boolean) as string[]
  );
  const assignedBirthdays = rosterDancers
    .filter((d) => assignedDancerIds.has(d.id))
    .map((d) => d.birthday);
  const avgAge = computeAverageAge(assignedBirthdays);

  return (
    <PageContainer fullWidth>
      {/* Top bar */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => navigate('/pieces')}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors shrink-0"
              aria-label="Back to pieces"
            >
              <ArrowLeft size={18} />
            </button>

            {isEditingTitle ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleTitleSave();
                    if (e.key === 'Escape') handleTitleCancel();
                  }}
                  className="text-xl font-bold text-slate-100 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-electric-500/50"
                  autoFocus
                />
                <button
                  onClick={handleTitleSave}
                  className="p-1 text-success-500 hover:text-success-600 transition-colors"
                  aria-label="Save title"
                >
                  <Check size={18} />
                </button>
                <button
                  onClick={handleTitleCancel}
                  className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
                  aria-label="Cancel editing"
                >
                  <X size={18} />
                </button>
              </div>
            ) : (
              <button
                onClick={handleTitleEdit}
                className="flex items-center gap-2 group text-left"
              >
                <h2 className="text-xl font-bold text-slate-100 truncate">
                  {piece.title}
                </h2>
                <Pencil
                  size={14}
                  className="text-slate-600 group-hover:text-slate-400 transition-colors shrink-0"
                />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap ml-8">
            {piece.style && <Badge>{piece.style}</Badge>}
            <Badge variant="info">
              <Users size={12} className="mr-1" />
              {piece.dancer_count} dancer{piece.dancer_count !== 1 ? 's' : ''}
            </Badge>
            {songText && (
              <Badge variant="default">
                <Music size={12} className="mr-1" />
                {songText}
              </Badge>
            )}
            {avgAge !== null && (
              <Badge variant="default">
                Avg age: {avgAge.toFixed(1)}
              </Badge>
            )}
          </div>
        </div>

        <Button onClick={handleSavePositions} loading={isSaving} disabled={isPlaying || isPaused}>
          <Save size={16} />
          Save
        </Button>
      </div>

      {/* Main workspace area */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Canvas area */}
        <div className="flex-1 flex flex-col gap-3">
          {/* Toolbar */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <CanvasToolbar
              showGrid={showGrid}
              snapToGrid={snapToGrid}
              zoom={zoom}
              canGoPrev={canGoPrev && !isPlaying}
              canGoNext={canGoNext && !isPlaying}
              canvasMode={canvasMode}
              hasSelectedPath={selectedPath != null}
              onToggleGrid={toggleGrid}
              onToggleSnap={toggleSnap}
              onZoomIn={() => setZoom((z) => Math.min(3, z + 0.1))}
              onZoomOut={() => setZoom((z) => Math.max(0.5, z - 0.1))}
              onZoomReset={() => setZoom(1)}
              onPrev={goPrev}
              onNext={goNext}
              onSetCanvasMode={setCanvasMode}
              onDeletePath={() => {
                if (selectedPath && activeFormationId) {
                  removePath(activeFormationId, selectedPath.dancerLabel);
                }
              }}
            />
            <PlaybackControls
              isPlaying={isPlaying}
              isPaused={isPaused}
              playbackSpeed={playbackSpeed}
              loopEnabled={loopEnabled}
              progress={playbackProgress}
              currentTransitionIndex={currentTransitionIndex}
              totalTransitions={totalTransitions}
              canPlay={formations.length >= 2}
              onPlay={() => startPlayback('sequence')}
              onPause={pausePlayback}
              onResume={resumePlayback}
              onStop={stopPlayback}
              onSetSpeed={setSpeed}
              onToggleLoop={toggleLoop}
            />
            {activeFormation && (
              <span className="text-sm text-slate-400 font-medium">
                {activeFormation.label || `Formation ${activeIdx + 1}`}
              </span>
            )}
          </div>

          {/* Formation Canvas */}
          <div className="flex-1 min-h-[400px]">
            <FormationCanvas piece={piece} playbackPositions={interpolatedPositions} />
          </div>

          {/* Thumbnail strip */}
          {formationsLoading ? (
            <div className="flex justify-center py-4">
              <Spinner />
            </div>
          ) : (
            <ThumbnailStrip
              piece={piece}
              formations={formations}
              positions={positions}
              activeFormationId={activeFormationId}
              onSelect={setActiveFormation}
              onAdd={handleAddFormation}
            />
          )}
        </div>

        {/* Right panel: notes */}
        {activeFormation && (
          <div className="lg:w-80 shrink-0 space-y-4">
            <Card
              header={
                <h3 className="text-sm font-semibold text-slate-200">
                  {activeFormation.label} — Notes
                </h3>
              }
            >
              <div className="space-y-4">
                <Textarea
                  label="Choreography Notes"
                  value={activeFormation.choreo_notes}
                  onChange={(e) =>
                    updateFormation(activeFormation.id, {
                      choreo_notes: e.target.value,
                    })
                  }
                  placeholder="Movement descriptions, directions, dynamics..."
                  rows={5}
                />
                <Textarea
                  label="Counts & Timing"
                  value={activeFormation.counts_notes}
                  onChange={(e) =>
                    updateFormation(activeFormation.id, {
                      counts_notes: e.target.value,
                    })
                  }
                  placeholder="5-6-7-8, hold 4 counts, transition on 1..."
                  rows={4}
                />
              </div>
            </Card>

            <Card>
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                  Positions
                </h4>
                {activePositions.length === 0 ? (
                  <p className="text-sm text-slate-500">No positions in this formation</p>
                ) : (
                  <div className="space-y-1.5">
                    {activePositions.map((pos) => (
                      <div
                        key={pos.id}
                        className="flex items-center gap-2 text-sm text-slate-300"
                      >
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: pos.color }}
                        />
                        <span className="font-mono text-xs w-5 shrink-0">{pos.dancer_label}</span>
                        <select
                          value={pos.dancer_id ?? ''}
                          onChange={(e) => {
                            if (activeFormationId) {
                              updateLocalPositionDancer(
                                activeFormationId,
                                pos.id,
                                e.target.value || null
                              );
                            }
                          }}
                          className="flex-1 text-xs bg-slate-700 border border-slate-600 rounded px-1.5 py-1 text-slate-200 min-w-0"
                        >
                          <option value="">Unassigned</option>
                          {rosterDancers.map((d) => (
                            <option key={d.id} value={d.id}>{d.short_name}</option>
                          ))}
                        </select>
                        <span className="text-slate-500 text-[10px] shrink-0">
                          ({Math.round(pos.x)},{Math.round(pos.y)})
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            {/* Transition Settings */}
            {activeIdx > 0 && (
              <Card
                header={
                  <button
                    onClick={() => setTransitionOpen((o) => !o)}
                    className="flex items-center justify-between w-full"
                  >
                    <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-1.5">
                      <Clock size={14} />
                      Transition
                    </h3>
                    {transitionOpen ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                  </button>
                }
              >
                {transitionOpen && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1.5">
                        Duration: {activeFormation.transition_duration_ms ?? 2000}ms
                        {piece.bpm ? ` (${((activeFormation.transition_duration_ms ?? 2000) / (60000 / piece.bpm)).toFixed(1)} counts)` : ''}
                      </label>
                      <input
                        type="range"
                        min={500}
                        max={5000}
                        step={100}
                        value={activeFormation.transition_duration_ms ?? 2000}
                        onChange={(e) =>
                          updateFormation(activeFormation.id, {
                            transition_duration_ms: parseInt(e.target.value),
                          })
                        }
                        className="w-full accent-electric-500"
                      />
                      <div className="flex justify-between text-[10px] text-slate-600 mt-0.5">
                        <span>0.5s</span>
                        <span>5s</span>
                      </div>
                    </div>

                    <Select
                      label="Easing"
                      options={EASING_OPTIONS.map((e) => ({ value: e.value, label: e.label }))}
                      value={(activeFormation.transition_easing ?? 'ease-in-out') as EasingType}
                      onChange={(e) =>
                        updateFormation(activeFormation.id, {
                          transition_easing: e.target.value,
                        })
                      }
                    />
                  </div>
                )}
              </Card>
            )}

            {/* Paths panel — only show when not the last formation */}
            {activeIdx >= 0 && activeIdx + 1 < formations.length && (() => {
              const activePaths = activeFormationId ? allPaths[activeFormationId] ?? [] : [];
              return activePaths.length > 0 ? (
                <Card
                  header={
                    <h3 className="text-sm font-semibold text-slate-200">
                      Paths ({activePaths.length})
                    </h3>
                  }
                >
                  <div className="space-y-1.5">
                    {activePaths.map((path) => {
                      const dancer = activePositions.find((p) => p.dancer_label === path.dancer_label);
                      const isSelected = selectedPath?.dancerLabel === path.dancer_label;
                      return (
                        <div
                          key={path.id}
                          className={`flex items-center gap-2 text-sm rounded-lg px-2 py-1.5 cursor-pointer transition-colors ${
                            isSelected ? 'bg-electric-500/10 text-slate-200' : 'text-slate-300 hover:bg-slate-700/50'
                          }`}
                          onClick={() => {
                            if (activeFormationId) {
                              usePathStore.getState().selectPath(activeFormationId, path.dancer_label);
                            }
                          }}
                        >
                          <span
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: dancer?.color ?? '#3B82F6' }}
                          />
                          <span className="font-mono text-xs flex-1">{path.dancer_label}</span>
                          <span className="text-[10px] text-slate-500 uppercase">{path.path_type}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (activeFormationId) removePath(activeFormationId, path.dancer_label);
                            }}
                            className="p-0.5 text-slate-500 hover:text-red-400 transition-colors"
                            title="Delete path"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              ) : null;
            })()}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
