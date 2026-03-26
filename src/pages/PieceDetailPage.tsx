import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Music, Users, Pencil, Download, Trash2, Share2 } from 'lucide-react';
import { PageContainer } from '@/components/layout';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { TemplatePickerModal } from '@/components/canvas';
import { PieceTabs, PieceNotesPanel, SongSectionsPanel, PieceRosterPanel, CanvasTab, FormationNotesPanel } from '@/components/pieces';
import type { PieceTab } from '@/components/pieces';
import { useSongSectionStore } from '@/stores/songSectionStore';
import type { FormationCanvasHandle } from '@/components/canvas';
import { usePlayback } from '@/hooks/usePlayback';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { useFormationEditor } from '@/hooks/useFormationEditor';
import { usePieceExport } from '@/hooks/usePieceExport';
import { usePieceStore } from '@/stores/pieceStore';
import { useFormationStore } from '@/stores/formationStore';
import { usePathStore } from '@/stores/pathStore';
import { useRosterStore } from '@/stores/rosterStore';
import { useAudioStore } from '@/stores/audioStore';
import { usePlaybackStore } from '@/stores/playbackStore';
import { computeAverageAge } from '@/lib/age';
import { toast } from '@/stores/toastStore';
import { uploadAudio, deleteAudio } from '@/services/audioStorage';
import { AddDancerModal } from '@/components/canvas/AddDancerModal';
import { PieceInfoModal } from '@/components/canvas/PieceInfoModal';
import { DancerManageModal } from '@/components/canvas/DancerManageModal';
import { ExportModal } from '@/components/export/ExportModal';
import { PrintView } from '@/components/export/PrintView';
import { KeyboardShortcutsModal } from '@/components/ui/KeyboardShortcutsModal';
import { ShareModal } from '@/components/pieces/ShareModal';

export function PieceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const canvasRef = useRef<FormationCanvasHandle>(null);

  // --- Store subscriptions ---
  const pieces = usePieceStore((s) => s.pieces);
  const loadPieces = usePieceStore((s) => s.load);
  const updatePiece = usePieceStore((s) => s.update);
  const removePiece = usePieceStore((s) => s.remove);

  const formations = useFormationStore((s) => s.formations);
  const positions = useFormationStore((s) => s.positions);
  const activeFormationId = useFormationStore((s) => s.activeFormationId);
  const loadFormations = useFormationStore((s) => s.load);
  const updateFormation = useFormationStore((s) => s.updateFormation);
  const setActiveFormation = useFormationStore((s) => s.setActiveFormation);
  const formationsLoading = useFormationStore((s) => s.isLoading);

  const loadPaths = usePathStore((s) => s.loadPaths);

  const rosterDancers = useRosterStore((s) => s.dancers);
  const loadRoster = useRosterStore((s) => s.load);
  const updateLocalPositionDancer = useFormationStore((s) => s.updateLocalPositionDancer);

  const setAudioUrl = useAudioStore((s) => s.setAudioUrl);

  const loadSongSections = useSongSectionStore((s) => s.load);
  const resetSongSections = useSongSectionStore((s) => s.reset);

  // --- Derived data ---
  const piece = pieces.find((p) => p.id === id);
  const activeFormation = formations.find((f) => f.id === activeFormationId);
  const activePositions = activeFormationId ? positions[activeFormationId] ?? [] : [];
  const activeIdx = formations.findIndex((f) => f.id === activeFormationId);

  // --- Hooks ---
  const {
    localChoreoNotes,
    setLocalChoreoNotes,
    localCountsNotes,
    setLocalCountsNotes,
    debouncedUpdateNotes,
    handleAddFormation,
    handleDeleteFormation,
    handleApplyTemplate,
    handleAddDancers,
    handleRemoveDancer,
    handleQuickPopulate,
    handleQuickAddDancer,
    handleSavePositions,
    canUndo,
    canRedo,
    handleUndo,
    handleRedo,
  } = useFormationEditor(id);

  const {
    handleExport,
    isExporting,
    exportModalOpen,
    setExportModalOpen,
    printData,
    setPrintData,
  } = usePieceExport(piece, formations, positions, canvasRef);

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

  // --- Local state ---
  const [activeTab, setActiveTab] = useState<PieceTab>('canvas');
  const [isSaving, setIsSaving] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
  const [addDancerModalOpen, setAddDancerModalOpen] = useState(false);
  const [pieceInfoOpen, setPieceInfoOpen] = useState(false);
  const [dancerManageOpen, setDancerManageOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [quickStartDismissed, setQuickStartDismissed] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  // --- Effects ---
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

  useEffect(() => {
    if (id) loadSongSections(id);
    return () => resetSongSections();
  }, [id, loadSongSections, resetSongSections]);

  useEffect(() => {
    if (formations.length > 0) {
      loadPaths(formations.map((f) => f.id));
    }
  }, [formations, loadPaths]);

  useEffect(() => {
    if (rosterDancers.length === 0) loadRoster();
  }, [rosterDancers.length, loadRoster]);

  // Global keyboard shortcut: ? opens keyboard shortcuts modal
  useEffect(() => {
    function handleShortcutKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
        e.preventDefault();
        setShortcutsOpen(true);
      }
    }
    document.addEventListener('keydown', handleShortcutKey);
    return () => document.removeEventListener('keydown', handleShortcutKey);
  }, []);

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

  // --- Handlers that stay in the page ---
  async function handleDeletePiece() {
    if (!piece) return;
    try {
      await removePiece(piece.id);
      navigate('/pieces');
    } catch {
      toast.error('Failed to delete piece');
    }
  }

  async function handleAudioUpload(file: File) {
    if (!piece) return;
    try {
      const url = await uploadAudio(piece.id, file);
      await updatePiece(piece.id, { audio_url: url });
    } catch {
      toast.error('Failed to upload audio');
    }
  }

  async function handleAudioRemove() {
    if (!piece?.audio_url) return;
    try {
      await deleteAudio(piece.audio_url);
      await updatePiece(piece.id, { audio_url: null });
    } catch {
      toast.error('Failed to remove audio');
    }
  }

  async function handleUpdateTimestamp(formationId: string, timestamp: number) {
    await updateFormation(formationId, { timestamp_seconds: timestamp });
  }

  async function onSavePositions() {
    setIsSaving(true);
    await handleSavePositions();
    setIsSaving(false);
  }

  // --- Loading / not found ---
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

  // --- Derived display values ---
  const songText =
    piece.song_title || piece.song_artist
      ? [piece.song_title, piece.song_artist].filter(Boolean).join(' — ')
      : null;

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
          <Button variant="secondary" size="sm" onClick={() => setShareModalOpen(true)}>
            <Share2 size={14} />
            <span className="hidden sm:inline">Share</span>
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setExportModalOpen(true)}>
            <Download size={14} />
            <span className="hidden sm:inline">Export</span>
          </Button>
          <Button size="sm" onClick={onSavePositions} loading={isSaving} disabled={isPlaying || isPaused}>
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

      {/* Tab bar */}
      <div className="mb-3">
        <PieceTabs activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      {/* Canvas tab */}
      <div style={{ display: activeTab === 'canvas' ? 'block' : 'none' }}>
        <CanvasTab
          piece={piece}
          canvasRef={canvasRef}
          zoom={zoom}
          onZoomChange={setZoom}
          quickStartDismissed={quickStartDismissed}
          onDismissQuickStart={() => setQuickStartDismissed(true)}
          isPlaying={isPlaying}
          isPaused={isPaused}
          interpolatedPositions={interpolatedPositions}
          playbackSpeed={playbackSpeed}
          loopEnabled={loopEnabled}
          playbackProgress={playbackProgress}
          currentTransitionIndex={currentTransitionIndex}
          totalTransitions={totalTransitions}
          startPlayback={startPlayback}
          pausePlayback={pausePlayback}
          resumePlayback={resumePlayback}
          stopPlayback={stopPlayback}
          setSpeed={setSpeed}
          toggleLoop={toggleLoop}
          onAddFormation={handleAddFormation}
          onDeleteFormation={handleDeleteFormation}
          onRemoveDancer={handleRemoveDancer}
          onQuickPopulate={handleQuickPopulate}
          onOpenTemplates={() => setTemplatePickerOpen(true)}
          onOpenAddDancer={() => setAddDancerModalOpen(true)}
          onShowShortcuts={() => setShortcutsOpen(true)}
          onUpdateFormation={updateFormation}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={handleUndo}
          onRedo={handleRedo}
        />

        {/* Right panel: notes */}
        {activeFormation && (
          <FormationNotesPanel
            piece={piece}
            activeFormation={activeFormation}
            activeFormationId={activeFormationId!}
            activePositions={activePositions}
            localChoreoNotes={localChoreoNotes}
            localCountsNotes={localCountsNotes}
            onChoreoNotesChange={(value) => {
              setLocalChoreoNotes(value);
              debouncedUpdateNotes('choreo_notes', value);
            }}
            onCountsNotesChange={(value) => {
              setLocalCountsNotes(value);
              debouncedUpdateNotes('counts_notes', value);
            }}
            formations={formations}
            isAudioPlaying={isAudioPlaying}
            audioCurrentTime={audioCurrentTime}
            audioDuration={audioDuration}
            audioUrl={piece.audio_url}
            toggleAudio={toggleAudio}
            seekAudio={seekAudio}
            hasAudio={hasAudio}
            onAudioUpload={handleAudioUpload}
            onAudioRemove={handleAudioRemove}
            onUpdateTimestamp={handleUpdateTimestamp}
            onSelectFormation={setActiveFormation}
            rosterDancers={rosterDancers}
            onToggleFocal={(dancerId) => updatePiece(piece.id, { focal_dancer_id: dancerId })}
            onAssign={updateLocalPositionDancer}
            onQuickAdd={handleQuickAddDancer}
            onAddDancer={() => setAddDancerModalOpen(true)}
            onRemoveDancer={handleRemoveDancer}
          />
        )}
      </div>{/* end canvas tab */}

      {/* Notes tab */}
      <div style={{ display: activeTab === 'notes' ? 'block' : 'none' }}>
        <PieceNotesPanel
          piece={piece}
          formations={formations}
          onUpdatePiece={(updates) => updatePiece(piece.id, updates)}
          onNavigateFormation={(formationId) => {
            setActiveFormation(formationId);
            setActiveTab('canvas');
          }}
        />
      </div>

      {/* Song Sections tab */}
      <div style={{ display: activeTab === 'sections' ? 'block' : 'none' }}>
        <SongSectionsPanel piece={piece} formations={formations} />
      </div>

      {/* Roster tab */}
      <div style={{ display: activeTab === 'roster' ? 'block' : 'none' }}>
        <PieceRosterPanel
          positions={activePositions}
          rosterDancers={rosterDancers}
          dancerCount={piece.dancer_count}
          activeFormationId={activeFormationId}
          onAssign={updateLocalPositionDancer}
          onAddDancer={() => setAddDancerModalOpen(true)}
          onRemoveDancer={() => handleRemoveDancer()}
          onRemoveSpecificDancer={piece.dancer_count > 1 ? handleRemoveDancer : undefined}
        />
      </div>

      {/* Modals */}
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
        onRemoveDancer={() => handleRemoveDancer()}
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

      <KeyboardShortcutsModal
        open={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
      />

      <ShareModal
        open={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        pieceId={piece.id}
        pieceTitle={piece.title}
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

      {/* Export overlay */}
      {isExporting && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm pointer-events-auto">
          <div className="flex flex-col items-center gap-3">
            <Spinner size="lg" />
            <p className="text-sm font-medium text-white">Exporting...</p>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
