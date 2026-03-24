import { useState, useEffect, useRef, memo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Music, Users, Pencil, Clock, ChevronDown, ChevronUp, Trash2, Volume2, Download, UserPlus, UserMinus } from 'lucide-react';
import { PageContainer } from '@/components/layout';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import { FormationCanvas, ThumbnailStrip, CanvasToolbar, PlaybackControls, TemplatePickerModal } from '@/components/canvas';
import type { FormationCanvasHandle } from '@/components/canvas';
import { usePlayback } from '@/hooks/usePlayback';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { EASING_OPTIONS } from '@/types';
import { usePieceStore } from '@/stores/pieceStore';
import { useFormationStore } from '@/stores/formationStore';
import { useUIStore } from '@/stores/uiStore';
import { usePathStore } from '@/stores/pathStore';
import { useRosterStore } from '@/stores/rosterStore';
import { useAudioStore } from '@/stores/audioStore';
import { usePlaybackStore } from '@/stores/playbackStore';
import { computeAverageAge } from '@/lib/age';
import { applyTemplate, generateLabel } from '@/lib/formationTemplates';
import { smartSnapPositions } from '@/lib/smartSnap';
import { toast } from '@/stores/toastStore';
import type { RoleAssignment } from '@/lib/formationTemplates';
import { DANCER_COLORS } from '@/types';
import { uploadAudio, deleteAudio } from '@/services/audioStorage';
import { AudioUploader } from '@/components/audio/AudioUploader';
import { AudioPlayer } from '@/components/audio/AudioPlayer';
import { AudioTimeline } from '@/components/audio/AudioTimeline';
import { AddDancerModal } from '@/components/canvas/AddDancerModal';
import { PieceInfoModal } from '@/components/canvas/PieceInfoModal';
import { DancerManageModal } from '@/components/canvas/DancerManageModal';
import type { AddDancerParams } from '@/components/canvas/AddDancerModal';
import { ExportModal } from '@/components/export/ExportModal';
import type { ExportFormat } from '@/components/export/ExportModal';
import { PrintView } from '@/components/export/PrintView';
import { exportPng } from '@/lib/exportImage';
import { exportPdf } from '@/lib/exportPdf';
import type { DancerPosition, DancerPositionInsert, EasingType, Dancer } from '@/types';

const PositionRow = memo(function PositionRow({
  pos,
  rosterDancers,
  activeFormationId,
  onAssign,
}: {
  pos: DancerPosition;
  rosterDancers: Dancer[];
  activeFormationId: string;
  onAssign: (formationId: string, positionId: string, dancerId: string | null, color?: string) => void;
}) {
  const assignedName = pos.dancer_id ? rosterDancers.find((d) => d.id === pos.dancer_id)?.short_name : null;
  return (
    <div className="flex items-center gap-2 text-sm text-text-primary">
      <span
        className="w-3 h-3 rounded-full shrink-0"
        style={{ backgroundColor: pos.color }}
      />
      <span className="text-xs w-5 shrink-0 font-medium">{assignedName ? assignedName.charAt(0).toUpperCase() : pos.dancer_label}</span>
      <select
        value={pos.dancer_id ?? ''}
        onChange={(e) => {
          const selectedId = e.target.value || null;
          const rosterDancer = selectedId ? rosterDancers.find((d) => d.id === selectedId) : null;
          onAssign(activeFormationId, pos.id, selectedId, rosterDancer?.color);
        }}
        className="flex-1 text-xs bg-surface-secondary border border-border rounded px-1.5 py-1 text-text-primary min-w-0"
      >
        <option value="">Unassigned</option>
        {rosterDancers.map((d) => (
          <option key={d.id} value={d.id}>{d.short_name}</option>
        ))}
      </select>
      <span className="text-text-tertiary text-[10px] shrink-0">
        ({Math.round(pos.x)},{Math.round(pos.y)})
      </span>
    </div>
  );
});

export function PieceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const canvasRef = useRef<FormationCanvasHandle>(null);
  const templateHintShown = useRef(false);

  const pieces = usePieceStore((s) => s.pieces);
  const loadPieces = usePieceStore((s) => s.load);
  const updatePiece = usePieceStore((s) => s.update);
  const removePiece = usePieceStore((s) => s.remove);

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
  const showStageNumbers = useUIStore((s) => s.showStageNumbers);
  const canvasMode = useUIStore((s) => s.canvasMode);
  const audiencePosition = useUIStore((s) => s.audiencePosition);
  const toggleGrid = useUIStore((s) => s.toggleGrid);
  const toggleSnap = useUIStore((s) => s.toggleSnap);
  const toggleStageNumbers = useUIStore((s) => s.toggleStageNumbers);
  const setCanvasMode = useUIStore((s) => s.setCanvasMode);
  const setAudiencePosition = useUIStore((s) => s.setAudiencePosition);

  const allPaths = usePathStore((s) => s.paths);
  const selectedPath = usePathStore((s) => s.selectedPath);
  const loadPaths = usePathStore((s) => s.loadPaths);
  const removePath = usePathStore((s) => s.removePath);

  const rosterDancers = useRosterStore((s) => s.dancers);
  const loadRoster = useRosterStore((s) => s.load);
  const addRosterDancer = useRosterStore((s) => s.add);
  const updateLocalPosition = useFormationStore((s) => s.updateLocalPosition);
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

  const {
    isAudioPlaying,
    currentTime: audioCurrentTime,
    duration: audioDuration,
    toggle: toggleAudio,
    seek: seekAudio,
    hasAudio,
  } = useAudioPlayer();

  const setAudioUrl = useAudioStore((s) => s.setAudioUrl);

  const [transitionOpen, setTransitionOpen] = useState(true);
  const [audioOpen, setAudioOpen] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
  const [addDancerModalOpen, setAddDancerModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [pieceInfoOpen, setPieceInfoOpen] = useState(false);
  const [dancerManageOpen, setDancerManageOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [printData, setPrintData] = useState<{ stageImages: (string | null)[] } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const isDirty = useFormationStore((s) => s.isDirty);

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

  // Auto-save positions when dirty (debounced 1.5s)
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!isDirty || !activeFormationId) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      // Save ALL formations that have positions (handles cross-formation dancer assignment)
      const allPositions = useFormationStore.getState().positions;
      const formationIds = Object.keys(allPositions);
      Promise.all(
        formationIds.map((fId) => {
          const positionsForFormation = allPositions[fId];
          if (!positionsForFormation || positionsForFormation.length === 0) return Promise.resolve();
          const inserts: DancerPositionInsert[] = positionsForFormation.map((pos) => ({
            formation_id: fId,
            dancer_id: pos.dancer_id,
            dancer_label: pos.dancer_label,
            x: pos.x,
            y: pos.y,
            color: pos.color,
          }));
          return savePositions(fId, inserts, true);
        })
      );
    }, 1500);
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [isDirty, activeFormationId, savePositions]);

  // Sync piece audio URL to audioStore + set playback mode
  useEffect(() => {
    if (piece?.audio_url) {
      setAudioUrl(piece.audio_url);
      usePlaybackStore.getState().setAudioMode(true);
    } else {
      setAudioUrl(null);
      usePlaybackStore.getState().setAudioMode(false);
    }
    return () => {
      useAudioStore.getState().reset();
      usePlaybackStore.getState().setAudioMode(false);
    };
  }, [piece?.audio_url, setAudioUrl]);

  async function handleDeletePiece() {
    if (!piece) return;
    await removePiece(piece.id);
    navigate('/pieces');
  }

  async function handleDeleteFormation() {
    if (!activeFormationId || formations.length <= 1) return;
    const removeFormation = useFormationStore.getState().removeFormation;
    await removeFormation(activeFormationId);
  }

  async function handleAudioUpload(file: File) {
    if (!piece) return;
    const url = await uploadAudio(piece.id, file);
    await updatePiece(piece.id, { audio_url: url });
  }

  async function handleAudioRemove() {
    if (!piece?.audio_url) return;
    await deleteAudio(piece.audio_url);
    await updatePiece(piece.id, { audio_url: null });
  }

  async function handleUpdateTimestamp(formationId: string, timestamp: number) {
    await updateFormation(formationId, { timestamp_seconds: timestamp });
  }

  async function handleExport(format: ExportFormat) {
    if (!piece) return;
    setIsExporting(true);

    try {
      if (format === 'png') {
        if (canvasRef.current) {
          exportPng(canvasRef.current, `${piece.title}_${activeFormation?.label ?? 'formation'}`);
        }
      } else if (format === 'pdf' || format === 'print') {
        // Capture each formation's stage image by switching active formation
        const stageImages: (string | null)[] = [];
        const originalActiveId = activeFormationId;

        for (const formation of formations) {
          setActiveFormation(formation.id);
          // Allow render to complete
          await new Promise((r) => setTimeout(r, 150));
          stageImages.push(canvasRef.current?.toDataURL(2) ?? null);
        }

        // Restore original
        if (originalActiveId) setActiveFormation(originalActiveId);

        if (format === 'pdf') {
          exportPdf({ piece, formations, positions, stageImages });
        } else {
          setPrintData({ stageImages });
        }
      }
    } finally {
      setIsExporting(false);
      setExportModalOpen(false);
    }
  }

  /** Add a dancer to a specific range of formations */
  async function handleAddDancers(params: AddDancerParams) {
    if (!piece) return;

    let dancerId = params.dancer.id;
    let dancerColor = params.dancer.color;

    // If creating a new dancer, add to roster first
    if (params.create) {
      const color = dancerColor || DANCER_COLORS[piece.dancer_count % DANCER_COLORS.length];
      const newDancer = await addRosterDancer({
        full_name: params.create.fullName,
        short_name: params.create.shortName,
        birthday: null,
        color,
        is_active: true,
        height: null, weight: null, bust: null, waist: null, hips: null, inseam: null,
        shoe_size: null, tights_size: null, headpiece_size: null,
        parent_name: null, parent_email: null, parent_phone: null,
        notes: '',
      });
      if (!newDancer) return;
      dancerId = newDancer.id;
      dancerColor = newDancer.color;
    }

    const newIdx = piece.dancer_count;
    const label = generateLabel(newIdx);
    const [startIdx, endIdx] = params.formationRange;

    await updatePiece(piece.id, { dancer_count: piece.dancer_count + 1 });

    for (let i = startIdx; i <= endIdx && i < formations.length; i++) {
      const formation = formations[i];
      const existing = positions[formation.id] ?? [];
      const newPosition: DancerPositionInsert = {
        formation_id: formation.id,
        dancer_id: dancerId,
        dancer_label: label,
        x: piece.stage_width / 2,
        y: piece.stage_depth / 2,
        color: dancerColor,
      };
      await savePositions(formation.id, [
        ...existing.map((p) => ({
          formation_id: formation.id,
          dancer_id: p.dancer_id,
          dancer_label: p.dancer_label,
          x: p.x,
          y: p.y,
          color: p.color,
        })),
        newPosition,
      ]);
    }

    // Low-count nudge
    const newCount = piece.dancer_count + 1;
    if (newCount < 4) {
      toast.info(`Only ${newCount} dancer${newCount !== 1 ? 's' : ''} so far — add more anytime from the toolbar.`);
    }

    // One-time template hint when first dancer added
    if (piece.dancer_count === 0 && !templateHintShown.current) {
      templateHintShown.current = true;
      toast.info('Tip: Use the Template button to quickly arrange dancers into formations.');
    }
  }

  async function handleRemoveDancer() {
    if (!piece || piece.dancer_count <= 1) return;
    const newCount = piece.dancer_count - 1;
    const removeLabel = generateLabel(newCount); // label of the last dancer

    // Update piece dancer count
    await updatePiece(piece.id, { dancer_count: newCount });

    // Remove that dancer's position from every formation
    for (const formation of formations) {
      const existing = positions[formation.id] ?? [];
      const filtered = existing.filter((p) => p.dancer_label !== removeLabel);
      await savePositions(formation.id, filtered.map((p) => ({
        formation_id: formation.id,
        dancer_id: p.dancer_id,
        dancer_label: p.dancer_label,
        x: p.x,
        y: p.y,
        color: p.color,
      })));
    }
  }

  /** Quick-populate N unnamed dancers into all formations */
  async function handleQuickPopulate(count: number) {
    if (!piece) return;

    await updatePiece(piece.id, { dancer_count: count });

    for (const formation of formations) {
      const positionInserts: DancerPositionInsert[] = [];
      for (let i = 0; i < count; i++) {
        const label = generateLabel(i);
        const color = DANCER_COLORS[i % DANCER_COLORS.length];
        // Spread dancers in a line across center, snapped to stage grid
        const SNAP = 1.25;
        const t = count === 1 ? 0.5 : i / (count - 1);
        positionInserts.push({
          formation_id: formation.id,
          dancer_id: null,
          dancer_label: label,
          x: Math.round((piece.stage_width * 0.1 + t * piece.stage_width * 0.8) / SNAP) * SNAP,
          y: Math.round((piece.stage_depth / 2) / SNAP) * SNAP,
          color,
        });
      }
      await savePositions(formation.id, positionInserts);
    }
  }

  const activeIdx = formations.findIndex((f) => f.id === activeFormationId);
  const canGoPrev = activeIdx > 0;
  const canGoNext = activeIdx >= 0 && activeIdx + 1 < formations.length;

  async function handleAddFormation() {
    if (!id) return;
    const label = `Formation ${formations.length + 1}`;
    // Capture current positions before adding (addFormation switches activeFormationId)
    const currentPositions = activeFormationId ? positions[activeFormationId] ?? [] : [];
    const newFormation = await addFormation({
      piece_id: id,
      index: formations.length,
      label,
      timestamp_seconds: null,
      choreo_notes: '',
      counts_notes: '',
      transition_duration_ms: 2000,
      transition_easing: 'ease-in-out',
    });
    // Copy dancer positions from the previous formation into the new one
    if (newFormation && currentPositions.length > 0) {
      const copiedPositions: DancerPositionInsert[] = currentPositions.map((p) => ({
        formation_id: newFormation.id,
        dancer_id: p.dancer_id,
        dancer_label: p.dancer_label,
        x: p.x,
        y: p.y,
        color: p.color,
      }));
      await savePositions(newFormation.id, copiedPositions);
      toast.info('Positions copied — tap a dancer to draw their transition path.');
    }
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

  async function handleApplyTemplate(templateId: string, roleAssignments?: RoleAssignment[]) {
    if (!activeFormationId || !piece) return;
    const newPositions = applyTemplate(
      templateId,
      piece.dancer_count,
      piece.stage_width,
      piece.stage_depth,
      activeFormationId,
      {
        roleAssignments,
        existingPositions: activePositions.map((p) => ({
          dancer_label: p.dancer_label,
          dancer_id: p.dancer_id,
          color: p.color,
        })),
      },
    );
    if (newPositions.length > 0) {
      await savePositions(activeFormationId, newPositions);
    }
  }

  if (!piece && !formationsLoading) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-text-secondary mb-4">Piece not found</p>
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
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => navigate('/pieces')}
            className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors shrink-0"
            aria-label="Back to pieces"
          >
            <ArrowLeft size={18} />
          </button>

          <button
            onClick={() => setPieceInfoOpen(true)}
            className="flex items-center gap-2 group text-left min-w-0"
          >
            <h2 className="text-lg font-bold text-text-primary truncate">
              {piece.title}
            </h2>
            <Pencil
              size={14}
              className="text-text-tertiary group-hover:text-text-secondary transition-colors shrink-0"
            />
          </button>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Button variant="secondary" size="sm" onClick={() => setExportModalOpen(true)}>
            <Download size={14} />
            <span className="hidden sm:inline">Export</span>
          </Button>
          <Button size="sm" onClick={handleSavePositions} loading={isSaving} disabled={isPlaying || isPaused}>
            <Save size={14} />
            <span className="hidden sm:inline">Save</span>
          </Button>
          <Button variant="danger" size="sm" onClick={() => setShowDeleteConfirm(true)}>
            <Trash2 size={14} />
          </Button>
        </div>
      </div>

      {/* Metadata badges */}
      <div className="flex items-center gap-1.5 flex-wrap mb-3 ml-9">
        {piece.style && (
          <button onClick={() => setPieceInfoOpen(true)} className="cursor-pointer hover:brightness-90 transition-all">
            <Badge>{piece.style}</Badge>
          </button>
        )}
        <button onClick={() => setDancerManageOpen(true)} className="cursor-pointer hover:brightness-90 transition-all">
          <Badge variant="info">
            <Users size={12} className="mr-1" />
            {piece.dancer_count} dancer{piece.dancer_count !== 1 ? 's' : ''}
          </Badge>
        </button>
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

      {/* Main workspace area */}
      <div className="flex flex-col gap-4 min-w-0">
        {/* Canvas area */}
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          {/* Toolbar */}
          <div className="flex items-center justify-between gap-2 flex-wrap min-w-0">
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
              onOpenTemplates={() => setTemplatePickerOpen(true)}
              onToggleGrid={toggleGrid}
              onToggleSnap={() => {
                const wasSnapped = snapToGrid;
                toggleSnap();
                // When turning snap ON, smart-distribute dancers across stage number lines
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
              onZoomIn={() => setZoom((z) => Math.min(3, z + 0.1))}
              onZoomOut={() => setZoom((z) => Math.max(0.5, z - 0.1))}
              onZoomReset={() => setZoom(1)}
              onPrev={goPrev}
              onNext={goNext}
              onSetCanvasMode={(mode) => {
                // If switching away from a draw mode while drawing, finish or cancel
                const pathState = usePathStore.getState();
                if (pathState.isDrawing) {
                  if (pathState.drawingPoints.length >= 2 && activeFormationId) {
                    // Has enough points — save what we have
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
              onAddDancer={() => setAddDancerModalOpen(true)}
              onRemoveDancer={handleRemoveDancer}
              onToggleAudiencePosition={() => setAudiencePosition(audiencePosition === 'top' ? 'bottom' : 'top')}
            />
            {activeFormation && (
              <span className="text-sm text-text-secondary font-medium">
                {activeFormation.label || `Formation ${activeIdx + 1}`}
              </span>
            )}
          </div>

          {/* Formation Canvas */}
          <div className="w-full min-h-[250px] h-[50vh] relative">
            <FormationCanvas ref={canvasRef} piece={piece} playbackPositions={interpolatedPositions} />
            {/* Playback controls — always pinned top-left of canvas */}
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
            {piece.dancer_count === 0 && activePositions.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="pointer-events-auto bg-surface-elevated/95 backdrop-blur-sm border border-border rounded-2xl p-8 max-w-sm text-center space-y-4 shadow-lg">
                  <p className="text-lg font-semibold text-text-primary">Blank canvas</p>
                  <p className="text-sm text-text-secondary">
                    Add dancers one at a time, or populate a group to get started.
                  </p>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => setAddDancerModalOpen(true)}
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
                        id="quick-populate-count"
                        className="flex-1 text-sm bg-surface-secondary border border-border rounded-xl px-3 py-2.5 text-text-primary text-center font-mono"
                      />
                      <button
                        onClick={async () => {
                          const input = document.getElementById('quick-populate-count') as HTMLInputElement;
                          const count = Math.max(1, Math.min(30, parseInt(input.value) || 8));
                          await handleQuickPopulate(count);
                        }}
                        className="flex-[2] px-4 py-2.5 rounded-xl accent-bg-light accent-text text-sm font-medium hover:brightness-105 transition-all"
                      >
                        Start with dancers
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
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
              paths={allPaths}
              rosterDancers={rosterDancers}
              activeFormationId={activeFormationId}
              onSelect={setActiveFormation}
              onAdd={handleAddFormation}
              onDelete={handleDeleteFormation}
              onDeletePath={(fId, label) => removePath(fId, label)}
              onDeleteAllPaths={(fId) => {
                const fPaths = allPaths[fId] ?? [];
                for (const p of fPaths) removePath(fId, p.dancer_label);
              }}
              onEditPath={(fId, label) => {
                setActiveFormation(fId);
                // Delete existing path and enter draw mode to redraw
                removePath(fId, label);
                setCanvasMode('draw-freehand');
              }}
              onPlayPath={(fId, dancerLabel) => {
                setActiveFormation(fId);
                // Play just this dancer's path in isolation
                const idx = formations.findIndex((f) => f.id === fId);
                if (idx >= 0 && idx < formations.length - 1) {
                  const durations = formations.slice(1).map((f) => f.transition_duration_ms ?? 2000);
                  usePlaybackStore.getState().play(formations.length - 1, idx, durations, 'single', dancerLabel);
                }
              }}
            />
          )}
        </div>

        {/* Right panel: notes */}
        {activeFormation && (
          <div className="w-full space-y-4 min-w-0">
            <Card
              header={
                <h3 className="text-sm font-semibold text-text-primary">
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

            {/* Audio */}
            <Card
              header={
                <button
                  onClick={() => setAudioOpen((o) => !o)}
                  className="flex items-center justify-between w-full"
                >
                  <h3 className="text-sm font-semibold text-text-primary flex items-center gap-1.5">
                    <Volume2 size={14} />
                    Audio
                  </h3>
                  {audioOpen ? <ChevronUp size={14} className="text-text-secondary" /> : <ChevronDown size={14} className="text-text-secondary" />}
                </button>
              }
            >
              {audioOpen && (
                <div className="space-y-3">
                  {hasAudio ? (
                    <>
                      <AudioPlayer
                        isPlaying={isAudioPlaying}
                        currentTime={audioCurrentTime}
                        duration={audioDuration}
                        onToggle={toggleAudio}
                        onSeek={seekAudio}
                      />
                      {audioDuration > 0 && (
                        <AudioTimeline
                          formations={formations}
                          duration={audioDuration}
                          currentTime={audioCurrentTime}
                          activeFormationId={activeFormationId}
                          onSeek={seekAudio}
                          onUpdateTimestamp={handleUpdateTimestamp}
                          onSelectFormation={setActiveFormation}
                        />
                      )}
                      <AudioUploader
                        onUpload={handleAudioUpload}
                        hasAudio={true}
                        onRemove={handleAudioRemove}
                      />
                    </>
                  ) : (
                    <AudioUploader
                      onUpload={handleAudioUpload}
                      hasAudio={false}
                      onRemove={handleAudioRemove}
                    />
                  )}
                </div>
              )}
            </Card>

            <Card>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-medium text-text-secondary uppercase tracking-wide">
                    Dancers ({piece.dancer_count})
                  </h4>
                  <div className="flex items-center gap-1.5">
                    <Button variant="secondary" size="sm" onClick={() => setAddDancerModalOpen(true)}>
                      <UserPlus size={12} />
                      Add
                    </Button>
                    <Button variant="secondary" size="sm" onClick={handleRemoveDancer} disabled={piece.dancer_count <= 0}>
                      <UserMinus size={12} />
                    </Button>
                  </div>
                </div>
                {activePositions.length === 0 ? (
                  <p className="text-sm text-text-tertiary">No dancers in this formation</p>
                ) : (
                  <div className="space-y-1.5">
                    {activePositions.map((pos) => (
                      <PositionRow
                        key={pos.id}
                        pos={pos}
                        rosterDancers={rosterDancers}
                        activeFormationId={activeFormationId!}
                        onAssign={updateLocalPositionDancer}
                      />
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
                    <h3 className="text-sm font-semibold text-text-primary flex items-center gap-1.5">
                      <Clock size={14} />
                      Transition
                    </h3>
                    {transitionOpen ? <ChevronUp size={14} className="text-text-secondary" /> : <ChevronDown size={14} className="text-text-secondary" />}
                  </button>
                }
              >
                {transitionOpen && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1.5">
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
                        className="w-full"
                        style={{ accentColor: 'var(--color-accent)' }}
                      />
                      <div className="flex justify-between text-[10px] text-text-tertiary mt-0.5">
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

          </div>
        )}
      </div>

      <AddDancerModal
        open={addDancerModalOpen}
        onClose={() => setAddDancerModalOpen(false)}
        rosterDancers={rosterDancers}
        assignedDancerIds={assignedDancerIds}
        formations={formations}
        activeFormationIndex={activeIdx}
        onAddDancers={handleAddDancers}
      />

      <TemplatePickerModal
        open={templatePickerOpen}
        onClose={() => setTemplatePickerOpen(false)}
        onSelect={handleApplyTemplate}
        dancerCount={piece.dancer_count}
        hasExistingPositions={activePositions.length > 0}
        currentPositions={activePositions.map((p) => ({
          dancer_label: p.dancer_label,
          dancer_id: p.dancer_id,
          color: p.color,
        }))}
        rosterDancers={rosterDancers}
      />

      <DancerManageModal
        open={dancerManageOpen}
        onClose={() => setDancerManageOpen(false)}
        positions={activePositions}
        rosterDancers={rosterDancers}
        dancerCount={piece.dancer_count}
        onAssign={updateLocalPositionDancer}
        activeFormationId={activeFormationId}
        onAddDancer={() => setAddDancerModalOpen(true)}
        onRemoveDancer={handleRemoveDancer}
      />

      <PieceInfoModal
        open={pieceInfoOpen}
        onClose={() => setPieceInfoOpen(false)}
        piece={piece}
        onSave={async (updates) => {
          await updatePiece(piece.id, updates);
        }}
      />

      <ExportModal
        open={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        onExport={handleExport}
        isExporting={isExporting}
        formationCount={formations.length}
      />

      {/* Delete piece confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-surface-elevated rounded-2xl border border-border p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-lg font-bold text-text-primary mb-2">Delete Piece</h3>
            <p className="text-sm text-text-secondary mb-6">
              This will permanently delete <strong>{piece?.title}</strong> and all its formations, positions, and paths. This cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
              <Button variant="danger" onClick={handleDeletePiece}>Delete</Button>
            </div>
          </div>
        </div>
      )}

      {printData && piece && (
        <PrintView
          piece={piece}
          formations={formations}
          positions={positions}
          stageImages={printData.stageImages}
          onClose={() => setPrintData(null)}
        />
      )}
    </PageContainer>
  );
}
