import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Pencil, Calendar, MapPin, Plus, Trash2,
  GripVertical, AlertTriangle, ChevronDown, ChevronUp,
  Search, Users, FileText, Wand2,
} from 'lucide-react';
import { PageContainer } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Modal } from '@/components/ui/Modal';
import { ShowFormModal } from '@/components/shows/ShowFormModal';
import { QuickAddPieceModal } from '@/components/pieces';
import { useShowStore } from '@/stores/showStore';
import { usePieceStore } from '@/stores/pieceStore';
import { useSeasonStore } from '@/stores/seasonStore';
import { useProfileStore } from '@/stores/profileStore';
import { useRosterStore } from '@/stores/rosterStore';
import { detectConflicts, buildPieceDancerMap } from '@/lib/showConflicts';
import { optimizeShowOrder } from '@/lib/showOptimizer';
import { generateProgramPDF } from '@/lib/exportProgram';
import type { ShowConflict } from '@/lib/showConflicts';
import { TierGate } from '@/components/ui/TierGate';
import type { Show, ShowAct, ShowActInsert } from '@/types';

// ── helpers ────────────────────────────────────────────────────────────────────

function formatDate(d: string | null) {
  if (!d) return null;
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

// ── component ──────────────────────────────────────────────────────────────────

export function ShowDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // ── store selectors ──────────────────────────────────────────────────────
  const shows = useShowStore((s) => s.shows);
  const showActs = useShowStore((s) => s.showActs);
  const isLoading = useShowStore((s) => s.isLoading);
  const loadAllShows = useShowStore((s) => s.loadAllShows);
  const loadShowActs = useShowStore((s) => s.loadShowActs);
  const updateShow = useShowStore((s) => s.updateShow);
  const addShowAct = useShowStore((s) => s.addShowAct);
  const updateShowAct = useShowStore((s) => s.updateShowAct);
  const removeShowAct = useShowStore((s) => s.removeShowAct);
  const removeShow = useShowStore((s) => s.removeShow);
  const reorderActs = useShowStore((s) => s.reorderActs);

  const pieces = usePieceStore((s) => s.pieces);
  const loadPieces = usePieceStore((s) => s.load);

  const seasons = useSeasonStore((s) => s.seasons);
  const loadSeasons = useSeasonStore((s) => s.loadSeasons);

  const studioName = useProfileStore((s) => s.studioName);

  const rosterDancers = useRosterStore((s) => s.dancers);
  const loadDancers = useRosterStore((s) => s.load);

  // ── local state ──────────────────────────────────────────────────────────
  const [showEditForm, setShowEditForm] = useState(false);
  const [showPiecePicker, setShowPiecePicker] = useState(false);
  const [pieceSearch, setPieceSearch] = useState('');
  const [conflictsExpanded, setConflictsExpanded] = useState(false);
  const [conflicts, setConflicts] = useState<ShowConflict[]>([]);
  const [pieceDancerMap, setPieceDancerMap] = useState<Map<string, Set<string>>>(new Map());
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // drag state
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropTarget, setDropTarget] = useState<number | null>(null);
  const dragCounterRef = useRef(0);

  const show: Show | undefined = shows.find((s) => s.id === id);
  const season = seasons.find((s) => s.id === show?.season_id);

  // Sort acts by act_number
  const sortedActs = useMemo(
    () => [...showActs].sort((a, b) => a.act_number - b.act_number),
    [showActs],
  );

  // ── data loading ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (shows.length === 0) loadAllShows();
    if (pieces.length === 0) loadPieces();
    if (seasons.length === 0) loadSeasons();
    if (rosterDancers.length === 0) loadDancers();
  }, [shows.length, pieces.length, seasons.length, rosterDancers.length, loadAllShows, loadPieces, loadSeasons, loadDancers]);

  useEffect(() => {
    if (id) loadShowActs(id);
  }, [id, loadShowActs]);

  // Build dancer map when acts or pieces change
  useEffect(() => {
    const pieceIds = [...new Set(sortedActs.map((a) => a.piece_id))];
    if (pieceIds.length === 0) {
      setPieceDancerMap(new Map());
      return;
    }
    let cancelled = false;
    buildPieceDancerMap(pieceIds).then((map) => {
      if (!cancelled) setPieceDancerMap(map);
    });
    return () => { cancelled = true; };
  }, [sortedActs]);

  // Detect conflicts when acts, dancer map, or buffer changes
  useEffect(() => {
    if (sortedActs.length === 0 || pieceDancerMap.size === 0) {
      setConflicts([]);
      return;
    }
    const orderedPieceIds = sortedActs.map((a) => a.piece_id);
    const result = detectConflicts(orderedPieceIds, pieceDancerMap, show?.buffer_acts ?? 2);
    setConflicts(result);
  }, [sortedActs, pieceDancerMap, show?.buffer_acts]);

  // ── dancer name lookup ──────────────────────────────────────────────────
  const dancerNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const d of rosterDancers) {
      map.set(d.id, d.short_name || d.full_name);
    }
    return map;
  }, [rosterDancers]);

  function getDancerNamesForPiece(pieceId: string): string[] {
    const dancerIds = pieceDancerMap.get(pieceId);
    if (!dancerIds || dancerIds.size === 0) return [];
    const names: string[] = [];
    for (const did of dancerIds) {
      const name = dancerNameMap.get(did);
      names.push(name ?? 'Unknown');
    }
    return names.sort();
  }

  // ── conflict helpers ─────────────────────────────────────────────────────
  const conflictIndices = useMemo(() => {
    const set = new Set<number>();
    for (const c of conflicts) {
      set.add(c.actIndex1);
      set.add(c.actIndex2);
    }
    return set;
  }, [conflicts]);

  // ── handlers ─────────────────────────────────────────────────────────────

  function getPieceTitle(pieceId: string) {
    return pieces.find((p) => p.id === pieceId)?.title ?? 'Unknown Piece';
  }

  function getPieceDancerCount(pieceId: string) {
    return pieces.find((p) => p.id === pieceId)?.dancer_count ?? 0;
  }

  async function handleEditShow(data: { season_id: string; name: string; date: string | null; venue: string; notes: string; buffer_acts: number }) {
    if (!id) return;
    await updateShow(id, {
      name: data.name,
      date: data.date,
      venue: data.venue,
      notes: data.notes,
      buffer_acts: data.buffer_acts,
    });
  }

  async function handleBufferChange(val: number) {
    if (!id) return;
    await updateShow(id, { buffer_acts: val });
  }

  async function handleAddAct(pieceId: string) {
    if (!id) return;
    const nextNum = sortedActs.length > 0
      ? Math.max(...sortedActs.map((a) => a.act_number)) + 1
      : 0;
    const act: ShowActInsert = {
      show_id: id,
      piece_id: pieceId,
      act_number: nextNum,
      intermission_before: false,
      notes: '',
    };
    await addShowAct(act);
  }

  async function handleToggleIntermission(act: ShowAct) {
    await updateShowAct(act.id, { intermission_before: !act.intermission_before });
  }

  async function handleDeleteAct(actId: string) {
    await removeShowAct(actId);
    setDeleteConfirmId(null);
  }

  // ── drag-and-drop ────────────────────────────────────────────────────────

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
    // Slight delay so the element renders as dragging
    requestAnimationFrame(() => {
      (e.target as HTMLElement).style.opacity = '0.4';
    });
  }, []);

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    (e.target as HTMLElement).style.opacity = '1';
    setDragIndex(null);
    setDropTarget(null);
    dragCounterRef.current = 0;
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    dragCounterRef.current++;
    setDropTarget(index);
  }, []);

  const handleDragLeave = useCallback(() => {
    dragCounterRef.current--;
    if (dragCounterRef.current <= 0) {
      setDropTarget(null);
      dragCounterRef.current = 0;
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    setDropTarget(null);
    dragCounterRef.current = 0;

    const sourceIndex = dragIndex;
    if (sourceIndex == null || sourceIndex === targetIndex || !id) return;

    // Reorder the array
    const reordered = [...sortedActs];
    const [moved] = reordered.splice(sourceIndex, 1);
    reordered.splice(targetIndex, 0, moved);

    const orderedIds = reordered.map((a) => a.id);
    reorderActs(id, orderedIds);
  }, [dragIndex, id, sortedActs, reorderActs]);

  // ── piece picker filtering ───────────────────────────────────────────────
  // Filter pieces to only those assigned to this show's season
  const seasonPieceIds = useSeasonStore((s) => s.pieceSeasons);
  const seasonFilteredPieces = useMemo(() => {
    if (!show?.season_id) return pieces;
    const assignedIds = new Set(
      seasonPieceIds
        .filter((ps) => ps.season_id === show.season_id)
        .map((ps) => ps.piece_id)
    );
    // If no pieces are assigned to the season yet, show all (graceful fallback)
    if (assignedIds.size === 0) return pieces;
    return pieces.filter((p) => assignedIds.has(p.id));
  }, [pieces, show?.season_id, seasonPieceIds]);

  const filteredPieces = useMemo(() => {
    const q = pieceSearch.toLowerCase().trim();
    if (!q) return seasonFilteredPieces;
    return seasonFilteredPieces.filter((p) =>
      p.title.toLowerCase().includes(q) ||
      (p.style && p.style.toLowerCase().includes(q)) ||
      (p.song_title && p.song_title.toLowerCase().includes(q))
    );
  }, [seasonFilteredPieces, pieceSearch]);

  const actPieceIds = useMemo(
    () => new Set(sortedActs.map((a) => a.piece_id)),
    [sortedActs],
  );

  // ── loading / not found states ───────────────────────────────────────────

  if (isLoading && !show) {
    return (
      <PageContainer>
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      </PageContainer>
    );
  }

  if (!show) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-text-secondary mb-4">Show not found</p>
          <Button variant="secondary" onClick={() => navigate('/shows')}>
            <ArrowLeft size={16} /> Back to Shows
          </Button>
        </div>
      </PageContainer>
    );
  }

  // ── render ───────────────────────────────────────────────────────────────
  return (
    <PageContainer fullWidth>
      <TierGate feature="shows">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <button
              onClick={() => navigate('/shows')}
              className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors"
            >
              <ArrowLeft size={18} />
            </button>
            <h2 className="text-xl font-bold text-text-primary">{show.name}</h2>
            <button
              onClick={() => setShowEditForm(true)}
              className="p-1 text-text-tertiary hover:text-text-secondary transition-colors"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-1 text-text-tertiary hover:text-danger-500 transition-colors"
              title="Delete show"
            >
              <Trash2 size={14} />
            </button>
          </div>
          <div className="flex items-center gap-2 flex-wrap ml-8">
            {season && <Badge>{season.name}</Badge>}
            {show.date && (
              <Badge variant="default">
                <Calendar size={12} className="mr-1" />
                {formatDate(show.date)}
              </Badge>
            )}
            {show.venue && (
              <Badge variant="default">
                <MapPin size={12} className="mr-1" />
                {show.venue}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Action buttons row */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <Button
          size="sm"
          variant="secondary"
          disabled={sortedActs.length === 0}
          onClick={() => {
            const programActs = sortedActs.map((act, i) => {
              const piece = pieces.find((p) => p.id === act.piece_id);
              const dancerNames = getDancerNamesForPiece(act.piece_id);
              return {
                actNumber: i + 1,
                title: piece?.title ?? 'Unknown Piece',
                style: piece?.style ?? null,
                dancerCount: piece?.dancer_count ?? 0,
                songTitle: piece?.song_title ?? null,
                songArtist: piece?.song_artist ?? null,
                intermissionBefore: act.intermission_before,
                dancerNames: dancerNames.length > 0 ? dancerNames : undefined,
                choreographer: piece?.choreographer ?? null,
              };
            });
            generateProgramPDF({
              showName: show.name,
              date: show.date,
              venue: show.venue,
              acts: programActs,
              studioName: studioName || undefined,
            });
          }}
        >
          <FileText size={14} /> Export Program
        </Button>
        <Button size="sm" variant="secondary" onClick={() => navigate(`/shows/${id}/backstage`)} disabled={sortedActs.length === 0}>
          Backstage View
        </Button>
      </div>

      {/* Buffer setting */}
      <Card className="mb-6">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-secondary">
            Min acts between same dancer: {show.buffer_acts}
          </label>
          <input
            type="range"
            min={1}
            max={5}
            step={1}
            value={show.buffer_acts}
            onChange={(e) => handleBufferChange(parseInt(e.target.value))}
            className="w-full max-w-xs"
            style={{ accentColor: 'var(--color-accent)' }}
          />
          <div className="flex justify-between text-[10px] text-text-tertiary max-w-xs">
            <span>1</span><span>5</span>
          </div>
        </div>
      </Card>

      {/* Conflict summary bar */}
      {conflicts.length > 0 && (
        <div className="mb-6 rounded-xl border border-warning-500/30 bg-warning-500/10 overflow-hidden">
          <button
            onClick={() => setConflictsExpanded(!conflictsExpanded)}
            className="w-full flex items-center gap-2 px-4 py-3 text-left"
          >
            <AlertTriangle size={16} className="text-warning-500 shrink-0" />
            <span className="text-sm font-medium text-warning-500 flex-1">
              {conflicts.length} conflict{conflicts.length !== 1 ? 's' : ''} — some dancers appear in back-to-back acts
            </span>
            {conflictsExpanded
              ? <ChevronUp size={14} className="text-warning-500" />
              : <ChevronDown size={14} className="text-warning-500" />
            }
          </button>
          {conflictsExpanded && (
            <div className="px-4 pb-3 space-y-2 border-t border-warning-500/20 pt-2">
              {conflicts.map((c, i) => (
                <div key={i} className="text-xs text-text-secondary">
                  Act {c.actIndex1 + 1} ({getPieceTitle(sortedActs[c.actIndex1]?.piece_id ?? '')})
                  {' & '}
                  Act {c.actIndex2 + 1} ({getPieceTitle(sortedActs[c.actIndex2]?.piece_id ?? '')})
                  {' — '}
                  {c.dancerIds.length} shared dancer{c.dancerIds.length !== 1 ? 's' : ''}, gap: {c.gap} (need {c.requiredGap})
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Act list */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-text-primary">
              Show Order ({sortedActs.length} act{sortedActs.length !== 1 ? 's' : ''})
            </h3>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                disabled={sortedActs.length < 2}
                onClick={() => {
                  if (!id || sortedActs.length < 2) return;
                  const pieceIds = sortedActs.map((a) => a.piece_id);
                  const optimized = optimizeShowOrder(pieceIds, pieceDancerMap, show.buffer_acts);
                  // Map optimized piece order back to act IDs
                  const pieceToActs = new Map<string, string[]>();
                  for (const act of sortedActs) {
                    const list = pieceToActs.get(act.piece_id) ?? [];
                    list.push(act.id);
                    pieceToActs.set(act.piece_id, list);
                  }
                  const optimizedActIds: string[] = [];
                  for (const pieceId of optimized) {
                    const actIds = pieceToActs.get(pieceId);
                    if (actIds && actIds.length > 0) {
                      optimizedActIds.push(actIds.shift()!);
                    }
                  }
                  reorderActs(id, optimizedActIds);
                }}
              >
                <Wand2 size={14} /> Auto-Arrange
              </Button>
              <Button size="sm" onClick={() => { setPieceSearch(''); setShowPiecePicker(true); }}>
                <Plus size={14} /> Add Act
              </Button>
            </div>
          </div>

          {sortedActs.length === 0 ? (
            <Card className="text-center py-10">
              <Users size={32} className="mx-auto text-text-tertiary mb-3" />
              <p className="text-sm text-text-tertiary mb-3">No acts yet. Add pieces to build your show order.</p>
              <Button size="sm" onClick={() => { setPieceSearch(''); setShowPiecePicker(true); }}>
                <Plus size={14} /> Add Act
              </Button>
            </Card>
          ) : (
            <div className="space-y-1">
              {sortedActs.map((act, index) => {
                const hasConflict = conflictIndices.has(index);
                const isDragging = dragIndex === index;
                const isDropTarget = dropTarget === index;

                return (
                  <div key={act.id}>
                    {/* Intermission marker */}
                    {act.intermission_before && (
                      <div className="flex items-center gap-3 py-2 px-3">
                        <div className="flex-1 border-t border-border-light" />
                        <span className="text-xs font-medium text-text-tertiary uppercase tracking-wider">Intermission</span>
                        <div className="flex-1 border-t border-border-light" />
                      </div>
                    )}

                    <div
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragEnd={handleDragEnd}
                      onDragEnter={(e) => handleDragEnter(e, index)}
                      onDragLeave={handleDragLeave}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, index)}
                      className={`
                        flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all
                        ${isDragging ? 'opacity-40' : ''}
                        ${isDropTarget && !isDragging
                          ? 'ring-2 ring-[var(--color-accent)] bg-[var(--color-accent-light)]/30'
                          : 'bg-surface hover:bg-surface-secondary/50'
                        }
                        ${hasConflict ? 'border border-warning-500/30' : 'border border-transparent'}
                        cursor-grab active:cursor-grabbing
                      `}
                    >
                      {/* Drag handle */}
                      <div className="text-text-tertiary shrink-0">
                        <GripVertical size={16} strokeWidth={1.75} />
                      </div>

                      {/* Act number */}
                      <span className="text-xs font-mono text-text-tertiary w-6 text-center shrink-0">
                        {index + 1}
                      </span>

                      {/* Piece info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">
                          {getPieceTitle(act.piece_id)}
                        </p>
                      </div>

                      {/* Dancer count */}
                      <span className="text-xs text-text-tertiary shrink-0 flex items-center gap-1">
                        <Users size={12} />
                        {getPieceDancerCount(act.piece_id)}
                      </span>

                      {/* Conflict indicator */}
                      {hasConflict && (
                        <Badge variant="warning" className="text-[10px] shrink-0">
                          <AlertTriangle size={10} className="mr-0.5" />
                          Conflict
                        </Badge>
                      )}

                      {/* Intermission toggle */}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleToggleIntermission(act); }}
                        className={`text-xs px-2 py-1 rounded-md transition-colors shrink-0 ${
                          act.intermission_before
                            ? 'bg-[var(--color-accent-light)] text-[var(--color-accent)]'
                            : 'text-text-tertiary hover:text-text-secondary hover:bg-surface-secondary'
                        }`}
                        title={act.intermission_before ? 'Remove intermission before' : 'Add intermission before'}
                      >
                        Int.
                      </button>

                      {/* Delete */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (deleteConfirmId === act.id) {
                            handleDeleteAct(act.id);
                          } else {
                            setDeleteConfirmId(act.id);
                          }
                        }}
                        onBlur={() => setDeleteConfirmId(null)}
                        className="p-1 text-text-tertiary hover:text-danger-500 transition-colors shrink-0"
                        title={deleteConfirmId === act.id ? 'Click again to confirm' : 'Remove act'}
                      >
                        <Trash2
                          size={14}
                          strokeWidth={1.75}
                          className={deleteConfirmId === act.id ? 'text-danger-500' : ''}
                        />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sidebar — show notes */}
        <div className="space-y-4">
          {show.notes && (
            <Card header={<h3 className="text-sm font-semibold text-text-primary">Notes</h3>}>
              <p className="text-sm text-text-secondary whitespace-pre-wrap">{show.notes}</p>
            </Card>
          )}

          {/* Quick stats */}
          <Card>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Total Acts</span>
                <span className="text-text-primary font-medium">{sortedActs.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Unique Pieces</span>
                <span className="text-text-primary font-medium">{actPieceIds.size}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Intermissions</span>
                <span className="text-text-primary font-medium">
                  {sortedActs.filter((a) => a.intermission_before).length}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Conflicts</span>
                <span className={`font-medium ${conflicts.length > 0 ? 'text-warning-500' : 'text-success-500'}`}>
                  {conflicts.length}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Edit show modal */}
      <ShowFormModal
        open={showEditForm}
        onClose={() => setShowEditForm(false)}
        onSubmit={handleEditShow}
        seasons={seasons.map((s) => ({ id: s.id, name: s.name }))}
        show={show}
      />

      {/* Piece picker modal */}
      <Modal
        open={showPiecePicker}
        onClose={() => setShowPiecePicker(false)}
        title="Add Act"
        size="lg"
      >
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <input
              type="text"
              value={pieceSearch}
              onChange={(e) => setPieceSearch(e.target.value)}
              placeholder="Search pieces..."
              className="w-full rounded-lg border border-border bg-surface-secondary pl-9 pr-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] transition-colors"
              autoFocus
            />
          </div>

          {/* New piece + count */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-tertiary">{filteredPieces.length} piece{filteredPieces.length !== 1 ? 's' : ''}</span>
            <button
              type="button"
              onClick={() => setShowQuickAdd(true)}
              className="text-xs text-[var(--color-accent)] hover:underline flex items-center gap-1"
            >
              <Plus size={12} /> New Piece
            </button>
          </div>

          {/* Piece list */}
          {filteredPieces.length === 0 ? (
            <p className="text-sm text-text-tertiary text-center py-6">No pieces found.</p>
          ) : (
            <div className="space-y-1 max-h-[50vh] overflow-y-auto">
              {filteredPieces.map((piece) => {
                const alreadyAdded = actPieceIds.has(piece.id);
                return (
                  <button
                    key={piece.id}
                    onClick={() => handleAddAct(piece.id)}
                    className="w-full flex items-center gap-3 p-2.5 rounded-lg text-left hover:bg-surface-secondary/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">
                        {piece.title}
                        {alreadyAdded && (
                          <span className="text-text-tertiary text-xs ml-2">(already added)</span>
                        )}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-text-secondary mt-0.5">
                        {piece.style && <span>{piece.style}</span>}
                        <span className="flex items-center gap-1">
                          <Users size={10} /> {piece.dancer_count}
                        </span>
                      </div>
                    </div>
                    <Plus size={16} className="text-text-tertiary shrink-0" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </Modal>

      {/* Quick add piece modal */}
      <QuickAddPieceModal
        open={showQuickAdd}
        onClose={() => setShowQuickAdd(false)}
        onCreated={(piece) => {
          handleAddAct(piece.id);
          setShowPiecePicker(false);
        }}
      />
      {/* Delete show confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-surface-elevated rounded-2xl border border-border p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-lg font-bold text-text-primary mb-2">Delete Show</h3>
            <p className="text-sm text-text-secondary mb-6">
              This will permanently delete <strong>{show.name}</strong> and all its acts. This cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
              <Button
                variant="danger"
                onClick={async () => {
                  await removeShow(show.id);
                  navigate('/shows');
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
      </TierGate>
    </PageContainer>
  );
}
