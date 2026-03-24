import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Plus, Pencil, Trophy, Calendar, MapPin, Music,
  Trash2, Award, ChevronDown, ChevronUp, LayoutList, GitBranch,
} from 'lucide-react';
import { PageContainer } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { SeasonFormModal } from '@/components/seasons/SeasonFormModal';
import { CompetitionFormModal } from '@/components/seasons/CompetitionFormModal';
import { EntryFormModal } from '@/components/seasons/EntryFormModal';
import { PiecePickerModal } from '@/components/seasons/PiecePickerModal';
import { SeasonTimeline } from '@/components/seasons/SeasonTimeline';
import { useSeasonStore } from '@/stores/seasonStore';
import { usePieceStore } from '@/stores/pieceStore';
import { AWARD_TIERS } from '@/types';
import type { Competition, CompetitionEntry, CompetitionInsert, CompetitionEntryInsert, SeasonInsert } from '@/types';

// ── helpers ────────────────────────────────────────────────────────────────────

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  const now = new Date();
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function urgencyVariant(days: number | null): 'danger' | 'warning' | 'info' | 'default' {
  if (days == null || days < 0) return 'default';
  if (days <= 3) return 'danger';
  if (days <= 14) return 'warning';
  return 'info';
}

// ── component ──────────────────────────────────────────────────────────────────

export function SeasonDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const seasons = useSeasonStore((s) => s.seasons);
  const loadSeasons = useSeasonStore((s) => s.loadSeasons);
  const updateSeason = useSeasonStore((s) => s.updateSeason);
  const competitions = useSeasonStore((s) => s.competitions);
  const loadCompetitions = useSeasonStore((s) => s.loadCompetitions);
  const addCompetition = useSeasonStore((s) => s.addCompetition);
  const updateCompetition = useSeasonStore((s) => s.updateCompetition);
  const removeCompetition = useSeasonStore((s) => s.removeCompetition);
  const entries = useSeasonStore((s) => s.entries);
  const loadEntriesBySeason = useSeasonStore((s) => s.loadEntriesBySeason);
  const addEntry = useSeasonStore((s) => s.addEntry);
  const updateEntry = useSeasonStore((s) => s.updateEntry);
  const removeEntry = useSeasonStore((s) => s.removeEntry);
  const pieceSeasons = useSeasonStore((s) => s.pieceSeasons);
  const assignPiece = useSeasonStore((s) => s.assignPiece);
  const unassignPiece = useSeasonStore((s) => s.unassignPiece);
  const isLoading = useSeasonStore((s) => s.isLoading);

  const pieces = usePieceStore((s) => s.pieces);
  const loadPieces = usePieceStore((s) => s.load);

  const [showSeasonForm, setShowSeasonForm] = useState(false);
  const [showCompForm, setShowCompForm] = useState(false);
  const [editComp, setEditComp] = useState<Competition | null>(null);
  const [showEntryForm, setShowEntryForm] = useState<string | null>(null); // competitionId
  const [editEntry, setEditEntry] = useState<CompetitionEntry | null>(null);
  const [showPiecePicker, setShowPiecePicker] = useState(false);
  const [expandedComps, setExpandedComps] = useState<Set<string>>(new Set());
  const [deleteConfirmComp, setDeleteConfirmComp] = useState<string | null>(null);
  const [deleteConfirmEntry, setDeleteConfirmEntry] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'timeline'>('list');
  const compCardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const season = seasons.find((s) => s.id === id);
  const assignedPieceIds = pieceSeasons.filter((ps) => ps.season_id === id).map((ps) => ps.piece_id);
  const assignedPieces = pieces.filter((p) => assignedPieceIds.includes(p.id));

  useEffect(() => {
    if (seasons.length === 0) loadSeasons();
    if (pieces.length === 0) loadPieces();
  }, [seasons.length, pieces.length, loadSeasons, loadPieces]);

  useEffect(() => {
    if (id) {
      loadCompetitions(id);
      loadEntriesBySeason(id);
    }
  }, [id, loadCompetitions, loadEntriesBySeason]);

  // Auto-expand competitions with entries
  useEffect(() => {
    if (competitions.length > 0) {
      setExpandedComps(new Set(competitions.map((c) => c.id)));
    }
  }, [competitions]);

  function toggleComp(compId: string) {
    setExpandedComps((prev) => {
      const next = new Set(prev);
      next.has(compId) ? next.delete(compId) : next.add(compId);
      return next;
    });
  }

  async function handleSeasonUpdate(data: SeasonInsert) {
    if (!id) return;
    await updateSeason(id, data);
  }

  async function handleCompSubmit(data: CompetitionInsert) {
    if (editComp) {
      await updateCompetition(editComp.id, data);
      setEditComp(null);
    } else {
      await addCompetition(data);
    }
  }

  async function handleEntrySubmit(data: CompetitionEntryInsert) {
    if (editEntry) {
      await updateEntry(editEntry.id, data);
      setEditEntry(null);
    } else {
      await addEntry(data);
    }
  }

  function handlePieceToggle(pieceId: string, assigned: boolean) {
    if (!id) return;
    if (assigned) {
      unassignPiece(pieceId, id);
    } else {
      assignPiece(pieceId, id);
    }
  }

  function handleSelectFromTimeline(compId: string) {
    // Expand if collapsed
    setExpandedComps((prev) => {
      const next = new Set(prev);
      next.add(compId);
      return next;
    });
    // Switch to list view if in timeline mode, then scroll
    setViewMode('list');
    setTimeout(() => {
      const el = compCardRefs.current[compId];
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 50);
  }

  function getEntriesForComp(compId: string) {
    return entries.filter((e) => e.competition_id === compId);
  }

  function getPieceTitle(pieceId: string) {
    return pieces.find((p) => p.id === pieceId)?.title ?? 'Unknown Piece';
  }

  function formatDate(d: string | null) {
    if (!d) return null;
    return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  if (isLoading && !season) {
    return (
      <PageContainer>
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      </PageContainer>
    );
  }

  if (!season) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-text-secondary mb-4">Season not found</p>
          <Button variant="secondary" onClick={() => navigate('/seasons')}>
            <ArrowLeft size={16} /> Back to Seasons
          </Button>
        </div>
      </PageContainer>
    );
  }

  // ── season-level stats ────────────────────────────────────────────────────
  const totalEntries = entries.length;
  const placedEntries = entries.filter((e) => e.placement).length;
  const avgScore = entries.filter((e) => e.score).length > 0
    ? entries.reduce((sum, e) => sum + (e.score ?? 0), 0) / entries.filter((e) => e.score).length
    : null;

  // ── season results banner calculations ───────────────────────────────────
  const allEntries = competitions.flatMap((comp) =>
    entries.filter((e) => e.competition_id === comp.id)
  );
  const entriesWithScores = allEntries.filter((e) => e.score != null);
  const bannerAvgScore = entriesWithScores.length > 0
    ? entriesWithScores.reduce((sum, e) => sum + (e.score ?? 0), 0) / entriesWithScores.length
    : null;
  const awardCounts: Record<string, number> = {};
  for (const e of allEntries) {
    if (e.award_tier) awardCounts[e.award_tier] = (awardCounts[e.award_tier] ?? 0) + 1;
  }
  const bestPlacement = allEntries
    .map((e) => e.placement)
    .filter(Boolean)
    .sort()[0] ?? null;
  const hasResults =
    entriesWithScores.length > 0 ||
    bestPlacement != null ||
    Object.keys(awardCounts).length > 0;

  // Award tiers in canonical order (only tiers that exist in awardCounts)
  const orderedAwardTiers = AWARD_TIERS.filter((t) => awardCounts[t] != null);

  return (
    <PageContainer fullWidth>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <button
              onClick={() => navigate('/seasons')}
              className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors"
            >
              <ArrowLeft size={18} />
            </button>
            <h2 className="text-xl font-bold text-text-primary">{season.name}</h2>
            <button
              onClick={() => setShowSeasonForm(true)}
              className="p-1 text-text-tertiary hover:text-text-secondary transition-colors"
            >
              <Pencil size={14} />
            </button>
          </div>
          <div className="flex items-center gap-2 flex-wrap ml-8">
            <Badge>{season.year}</Badge>
            {season.start_date && (
              <Badge variant="default">
                <Calendar size={12} className="mr-1" />
                {formatDate(season.start_date)}{season.end_date ? ` – ${formatDate(season.end_date)}` : ''}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <Card className="text-center py-3">
          <p className="text-2xl font-bold text-text-primary">{assignedPieces.length}</p>
          <p className="text-xs text-text-secondary">Pieces</p>
        </Card>
        <Card className="text-center py-3">
          <p className="text-2xl font-bold text-text-primary">{competitions.length}</p>
          <p className="text-xs text-text-secondary">Competitions</p>
        </Card>
        <Card className="text-center py-3">
          <p className="text-2xl font-bold text-text-primary">{placedEntries}/{totalEntries}</p>
          <p className="text-xs text-text-secondary">Results</p>
        </Card>
        <Card className="text-center py-3">
          <p className="text-2xl font-bold text-text-primary">{avgScore ? avgScore.toFixed(1) : '—'}</p>
          <p className="text-xs text-text-secondary">Avg Score</p>
        </Card>
      </div>

      {/* Season Results Banner */}
      {hasResults && (
        <Card className="mb-6">
          <div className="flex items-center gap-1.5 mb-3">
            <Trophy size={14} className="accent-text" />
            <span className="text-sm font-semibold text-text-primary">Season Results</span>
          </div>
          <div className="flex flex-wrap items-start gap-6">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-text-tertiary uppercase tracking-wide">Total Entries</span>
              <span className="text-lg font-bold text-text-primary">{allEntries.length}</span>
            </div>
            {bannerAvgScore != null && (
              <div className="flex flex-col gap-1">
                <span className="text-xs text-text-tertiary uppercase tracking-wide">Avg Score</span>
                <span className="text-lg font-bold text-text-primary">{bannerAvgScore.toFixed(2)}</span>
              </div>
            )}
            {bestPlacement && (
              <div className="flex flex-col gap-1">
                <span className="text-xs text-text-tertiary uppercase tracking-wide">Best Placement</span>
                <span className="text-lg font-bold text-text-primary">{bestPlacement}</span>
              </div>
            )}
            {orderedAwardTiers.length > 0 && (
              <div className="flex flex-col gap-1">
                <span className="text-xs text-text-tertiary uppercase tracking-wide">Award Tiers</span>
                <div className="flex flex-wrap gap-1.5">
                  {orderedAwardTiers.map((tier) => (
                    <Badge key={tier} variant="success" className="text-[10px]">
                      {awardCounts[tier]} {tier}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Pieces */}
        <div className="lg:col-span-1 space-y-4">
          <Card
            header={
              <div className="flex items-center justify-between w-full">
                <h3 className="text-sm font-semibold text-text-primary">Pieces</h3>
                <Button size="sm" variant="ghost" onClick={() => setShowPiecePicker(true)}>
                  <Plus size={14} /> Assign
                </Button>
              </div>
            }
          >
            {assignedPieces.length === 0 ? (
              <p className="text-sm text-text-tertiary text-center py-4">No pieces assigned yet.</p>
            ) : (
              <div className="space-y-1.5">
                {assignedPieces.map((piece) => (
                  <Link
                    key={piece.id}
                    to={`/pieces/${piece.id}`}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-surface-secondary/50 transition-colors"
                  >
                    <Music size={14} className="accent-text shrink-0" />
                    <span className="text-sm text-text-primary truncate">{piece.title}</span>
                    <span className="text-xs text-text-tertiary ml-auto shrink-0">
                      {piece.dancer_count}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </Card>

          {season.notes && (
            <Card
              header={<h3 className="text-sm font-semibold text-text-primary">Notes</h3>}
            >
              <p className="text-sm text-text-secondary whitespace-pre-wrap">{season.notes}</p>
            </Card>
          )}
        </div>

        {/* Right: Competitions */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-text-primary">Competitions</h3>
            <div className="flex items-center gap-2">
              {/* View toggle */}
              <div className="flex items-center rounded-lg border border-border overflow-hidden">
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex items-center gap-1 px-2.5 py-1.5 text-xs transition-colors ${
                    viewMode === 'list'
                      ? 'bg-accent-500 text-white'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary'
                  }`}
                  title="List view"
                >
                  <LayoutList size={12} />
                  <span>List</span>
                </button>
                <button
                  onClick={() => setViewMode('timeline')}
                  className={`flex items-center gap-1 px-2.5 py-1.5 text-xs transition-colors ${
                    viewMode === 'timeline'
                      ? 'bg-accent-500 text-white'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary'
                  }`}
                  title="Timeline view"
                >
                  <GitBranch size={12} />
                  <span>Timeline</span>
                </button>
              </div>
              <Button size="sm" onClick={() => setShowCompForm(true)}>
                <Plus size={14} /> Add Competition
              </Button>
            </div>
          </div>

          {/* Timeline — shown above list when active */}
          {viewMode === 'timeline' && competitions.length > 0 && (
            <Card>
              <SeasonTimeline
                competitions={competitions}
                seasonStart={season.start_date}
                seasonEnd={season.end_date}
                onSelectCompetition={handleSelectFromTimeline}
              />
            </Card>
          )}

          {competitions.length === 0 ? (
            <Card className="text-center py-8">
              <Trophy size={32} className="mx-auto text-text-tertiary mb-3" />
              <p className="text-sm text-text-tertiary">No competitions added yet.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {competitions.map((comp) => {
                const compEntries = getEntriesForComp(comp.id);
                const isExpanded = expandedComps.has(comp.id);

                // Per-comp award tier counts
                const compAwardCounts: Record<string, number> = {};
                for (const e of compEntries) {
                  if (e.award_tier) compAwardCounts[e.award_tier] = (compAwardCounts[e.award_tier] ?? 0) + 1;
                }
                const compOrderedTiers = AWARD_TIERS.filter((t) => compAwardCounts[t] != null);

                // Urgency
                const dateDays = daysUntil(comp.date);
                const deadlineDays = daysUntil(comp.entry_deadline);
                const dateVariant = urgencyVariant(dateDays);
                const deadlineVariant = urgencyVariant(deadlineDays);

                return (
                  <div
                    key={comp.id}
                    ref={(el) => { compCardRefs.current[comp.id] = el; }}
                  >
                  <Card>
                    {/* Competition header */}
                    <div className="flex items-start justify-between gap-2">
                      <button
                        onClick={() => toggleComp(comp.id)}
                        className="flex items-start gap-3 text-left flex-1 min-w-0"
                      >
                        <div className="flex items-center justify-center w-9 h-9 rounded-lg accent-bg-light shrink-0 mt-0.5">
                          <Trophy size={16} className="accent-text" />
                        </div>
                        <div className="flex-1 min-w-0">
                          {/* Company badge */}
                          {comp.company_name && (
                            <div className="mb-1">
                              <Badge variant="default" className="text-[10px]">
                                {comp.company_name}
                              </Badge>
                            </div>
                          )}
                          <h4 className="text-sm font-semibold text-text-primary">{comp.name}</h4>
                          <div className="flex items-center gap-2 text-xs text-text-secondary mt-0.5 flex-wrap">
                            {comp.date && (
                              <span className="flex items-center gap-1">
                                <Calendar size={10} />
                                {formatDate(comp.date)}
                                {dateVariant !== 'default' && dateDays != null && dateDays >= 0 && (
                                  <Badge variant={dateVariant} className="text-[10px] ml-0.5">
                                    {dateDays}d
                                  </Badge>
                                )}
                              </span>
                            )}
                            {comp.location && (
                              <span className="flex items-center gap-1">
                                <MapPin size={10} /> {comp.location}
                              </span>
                            )}
                          </div>
                          {/* Entry deadline urgency */}
                          {comp.entry_deadline && deadlineDays != null && deadlineDays >= 0 && deadlineVariant !== 'default' && (
                            <div className="mt-1">
                              <Badge variant={deadlineVariant} className="text-[10px]">
                                Deadline in {deadlineDays}d
                              </Badge>
                            </div>
                          )}
                          {/* Scoring system */}
                          {comp.scoring_system && (
                            <div className="mt-1">
                              <Badge variant="info" className="text-[10px]">
                                {comp.scoring_system === 'tiered' ? 'Tiered' : comp.scoring_system === 'ranked' ? 'Ranked' : comp.scoring_system}
                              </Badge>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0 mt-1 flex-col items-end">
                          <div className="flex items-center gap-1">
                            <Badge variant="info" className="text-[10px]">
                              {compEntries.length} entr{compEntries.length !== 1 ? 'ies' : 'y'}
                            </Badge>
                            {isExpanded ? <ChevronUp size={14} className="text-text-tertiary" /> : <ChevronDown size={14} className="text-text-tertiary" />}
                          </div>
                          {/* Per-comp award tier pills */}
                          {compOrderedTiers.length > 0 && (
                            <div className="flex flex-wrap gap-1 justify-end mt-1">
                              {compOrderedTiers.map((tier) => (
                                <Badge key={tier} variant="success" className="text-[10px]">
                                  {compAwardCounts[tier]} {tier}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </button>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => { setEditComp(comp); setShowCompForm(true); }}
                          className="p-1 text-text-tertiary hover:text-text-secondary transition-colors"
                          title="Edit competition"
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          onClick={() => {
                            if (deleteConfirmComp === comp.id) {
                              removeCompetition(comp.id);
                              setDeleteConfirmComp(null);
                            } else {
                              setDeleteConfirmComp(comp.id);
                            }
                          }}
                          onBlur={() => setDeleteConfirmComp(null)}
                          className="p-1 text-text-tertiary hover:text-danger-500 transition-colors"
                          title={deleteConfirmComp === comp.id ? 'Click again to confirm' : 'Delete competition'}
                        >
                          <Trash2 size={12} className={deleteConfirmComp === comp.id ? 'text-danger-500' : ''} />
                        </button>
                      </div>
                    </div>

                    {/* Entries */}
                    {isExpanded && (
                      <div className="mt-4 pt-3 border-t border-border">
                        {compEntries.length === 0 ? (
                          <p className="text-xs text-text-tertiary text-center py-2">No entries yet.</p>
                        ) : (
                          <div className="space-y-2">
                            {compEntries.map((entry) => (
                              <div
                                key={entry.id}
                                className="flex items-center gap-3 p-2.5 rounded-lg bg-surface-secondary/50"
                              >
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-text-primary truncate">
                                    {getPieceTitle(entry.piece_id)}
                                  </p>
                                  <p className="text-xs text-text-secondary">{entry.category || 'No category'}</p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  {entry.score != null && (
                                    <span className="text-xs font-mono text-text-secondary">{entry.score}</span>
                                  )}
                                  {entry.award_tier && (
                                    <Badge variant="success" className="text-[10px]">
                                      {entry.award_tier}
                                    </Badge>
                                  )}
                                  {entry.placement && (
                                    <Badge variant="success" className="text-[10px]">
                                      <Award size={10} className="mr-0.5" />
                                      {entry.placement}
                                    </Badge>
                                  )}
                                  {entry.special_awards && (
                                    <Badge className="text-[10px]">{entry.special_awards}</Badge>
                                  )}
                                  <button
                                    onClick={() => { setEditEntry(entry); setShowEntryForm(comp.id); }}
                                    className="p-0.5 text-text-tertiary hover:text-text-secondary transition-colors"
                                  >
                                    <Pencil size={10} />
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (deleteConfirmEntry === entry.id) {
                                        removeEntry(entry.id);
                                        setDeleteConfirmEntry(null);
                                      } else {
                                        setDeleteConfirmEntry(entry.id);
                                      }
                                    }}
                                    onBlur={() => setDeleteConfirmEntry(null)}
                                    className="p-0.5 text-text-tertiary hover:text-danger-500 transition-colors"
                                  >
                                    <Trash2 size={10} className={deleteConfirmEntry === entry.id ? 'text-danger-500' : ''} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => { setEditEntry(null); setShowEntryForm(comp.id); }}
                          className="mt-2 w-full"
                        >
                          <Plus size={12} /> Add Entry
                        </Button>
                      </div>
                    )}
                  </Card>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <SeasonFormModal
        open={showSeasonForm}
        onClose={() => setShowSeasonForm(false)}
        onSubmit={handleSeasonUpdate}
        season={season}
      />
      <CompetitionFormModal
        open={showCompForm}
        onClose={() => { setShowCompForm(false); setEditComp(null); }}
        onSubmit={handleCompSubmit}
        seasonId={id!}
        competition={editComp}
      />
      {showEntryForm && (
        <EntryFormModal
          open={!!showEntryForm}
          onClose={() => { setShowEntryForm(null); setEditEntry(null); }}
          onSubmit={handleEntrySubmit}
          competitionId={showEntryForm}
          pieces={assignedPieces.length > 0 ? assignedPieces : pieces}
          entry={editEntry}
          divisions={competitions.find((c) => c.id === showEntryForm)?.configured_divisions}
          categories={competitions.find((c) => c.id === showEntryForm)?.configured_categories}
          levels={competitions.find((c) => c.id === showEntryForm)?.configured_levels}
          styles={competitions.find((c) => c.id === showEntryForm)?.configured_styles}
        />
      )}
      <PiecePickerModal
        open={showPiecePicker}
        onClose={() => setShowPiecePicker(false)}
        pieces={pieces}
        assignedPieceIds={assignedPieceIds}
        onToggle={handlePieceToggle}
      />
    </PageContainer>
  );
}
