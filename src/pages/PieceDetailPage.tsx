import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { PageContainer } from '@/components/layout';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { PieceTabs, PieceNotesPanel, SongSectionsPanel, PieceRosterPanel, CanvasTab, FormationNotesPanel } from '@/components/pieces';
import type { PieceTab } from '@/components/pieces';
import { useSongSectionStore } from '@/stores/songSectionStore';
import type { FormationCanvasHandle } from '@/components/canvas';
import { PieceDetailHeader } from '@/components/pieces/PieceDetailHeader';
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
import { PieceDetailModals } from '@/components/pieces/PieceDetailModals';
import { DeletePieceDialog } from '@/components/pieces/DeletePieceDialog';

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
    saveStatus,
    flushPendingSaves,
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
      // Flush BEFORE wiping the store — edits younger than the autosave
      // debounce would otherwise be lost on every navigation away.
      // (performSave snapshots synchronously, so reset() right after is safe.)
      void flushPendingSaves();
      useFormationStore.getState().reset();
      usePathStore.getState().reset();
    };
  }, [id, loadFormations, flushPendingSaves]);

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
    try {
      await updateFormation(formationId, { timestamp_seconds: timestamp });
    } catch {
      toast.error('Failed to update timestamp');
    }
  }

  async function onSavePositions() {
    setIsSaving(true);
    try {
      await handleSavePositions();
    } catch {
      toast.error('Failed to save positions');
    }
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
  const assignedDancerIds = new Set(
    Object.values(positions).flat().map((p) => p.dancer_id).filter(Boolean) as string[]
  );
  const assignedBirthdays = rosterDancers
    .filter((d) => assignedDancerIds.has(d.id))
    .map((d) => d.birthday);
  const avgAge = computeAverageAge(assignedBirthdays);

  return (
    <PageContainer fullWidth>
      <PieceDetailHeader
        piece={piece}
        avgAge={avgAge}
        saveStatus={saveStatus}
        isSaving={isSaving}
        saveDisabled={isPlaying || isPaused}
        onBack={() => navigate('/pieces')}
        onOpenInfo={() => setPieceInfoOpen(true)}
        onOpenDancerManage={() => setDancerManageOpen(true)}
        onOpenShare={() => setShareModalOpen(true)}
        onOpenExport={() => setExportModalOpen(true)}
        onSave={onSavePositions}
        onDelete={() => setShowDeleteConfirm(true)}
      />

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

      {/* Modals + overlays */}
      <PieceDetailModals
        piece={piece}
        formations={formations}
        positions={positions}
        activePositions={activePositions}
        activeIdx={activeIdx}
        activeFormationId={activeFormationId}
        rosterDancers={rosterDancers}
        assignedDancerIds={assignedDancerIds}
        addDancerOpen={addDancerModalOpen}
        templatePickerOpen={templatePickerOpen}
        dancerManageOpen={dancerManageOpen}
        pieceInfoOpen={pieceInfoOpen}
        exportModalOpen={exportModalOpen}
        shortcutsOpen={shortcutsOpen}
        shareModalOpen={shareModalOpen}
        onCloseAddDancer={() => setAddDancerModalOpen(false)}
        onCloseTemplatePicker={() => setTemplatePickerOpen(false)}
        onCloseDancerManage={() => setDancerManageOpen(false)}
        onClosePieceInfo={() => setPieceInfoOpen(false)}
        onCloseExportModal={() => setExportModalOpen(false)}
        onCloseShortcuts={() => setShortcutsOpen(false)}
        onCloseShareModal={() => setShareModalOpen(false)}
        onAddDancers={handleAddDancers}
        onApplyTemplate={handleApplyTemplate}
        onAssign={updateLocalPositionDancer}
        onOpenAddDancer={() => setAddDancerModalOpen(true)}
        onRemoveDancer={() => handleRemoveDancer()}
        onSavePieceInfo={async (updates) => {
          await updatePiece(piece.id, updates);
        }}
        onExport={handleExport}
        isExporting={isExporting}
        printData={printData}
        onClosePrint={() => setPrintData(null)}
      />

      {/* Delete piece confirmation */}
      <DeletePieceDialog
        open={showDeleteConfirm}
        pieceTitle={piece.title}
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeletePiece}
      />
    </PageContainer>
  );
}
