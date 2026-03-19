import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Music, Users, Pencil, Check, X } from 'lucide-react';
import { PageContainer } from '@/components/layout';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Textarea } from '@/components/ui/Textarea';
import { Spinner } from '@/components/ui/Spinner';
import { FormationCanvas, ThumbnailStrip, CanvasToolbar } from '@/components/canvas';
import { usePieceStore } from '@/stores/pieceStore';
import { useFormationStore } from '@/stores/formationStore';
import { useUIStore } from '@/stores/uiStore';
import type { DancerPositionInsert } from '@/types';

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
  const toggleGrid = useUIStore((s) => s.toggleGrid);
  const toggleSnap = useUIStore((s) => s.toggleSnap);

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
    };
  }, [id, loadFormations]);

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
          </div>
        </div>

        <Button onClick={handleSavePositions} loading={isSaving}>
          <Save size={16} />
          Save
        </Button>
      </div>

      {/* Main workspace area */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Canvas area */}
        <div className="flex-1 flex flex-col gap-3">
          {/* Toolbar */}
          <div className="flex items-center justify-between">
            <CanvasToolbar
              showGrid={showGrid}
              snapToGrid={snapToGrid}
              zoom={zoom}
              canGoPrev={canGoPrev}
              canGoNext={canGoNext}
              onToggleGrid={toggleGrid}
              onToggleSnap={toggleSnap}
              onZoomIn={() => setZoom((z) => Math.min(3, z + 0.1))}
              onZoomOut={() => setZoom((z) => Math.max(0.5, z - 0.1))}
              onZoomReset={() => setZoom(1)}
              onPrev={goPrev}
              onNext={goNext}
            />
            {activeFormation && (
              <span className="text-sm text-slate-400 font-medium">
                {activeFormation.label || `Formation ${activeIdx + 1}`}
              </span>
            )}
          </div>

          {/* Formation Canvas */}
          <div className="flex-1 min-h-[400px]">
            <FormationCanvas piece={piece} />
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
                  <div className="space-y-1">
                    {activePositions.map((pos) => (
                      <div
                        key={pos.id}
                        className="flex items-center gap-2 text-sm text-slate-300"
                      >
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: pos.color }}
                        />
                        <span className="font-mono text-xs">{pos.dancer_label}</span>
                        <span className="text-slate-500 text-xs">
                          ({Math.round(pos.x)}, {Math.round(pos.y)})
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
