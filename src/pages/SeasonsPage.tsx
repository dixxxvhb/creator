import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trophy, Calendar, ArrowRight } from 'lucide-react';
import { PageContainer } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { SeasonFormModal } from '@/components/seasons/SeasonFormModal';
import { useSeasonStore } from '@/stores/seasonStore';
import { usePieceStore } from '@/stores/pieceStore';
import type { SeasonInsert } from '@/types';
import { TierGate } from '@/components/ui/TierGate';

export function SeasonsPage() {
  const seasons = useSeasonStore((s) => s.seasons);
  const pieceSeasons = useSeasonStore((s) => s.pieceSeasons);
  const isLoading = useSeasonStore((s) => s.isLoading);
  const loadSeasons = useSeasonStore((s) => s.loadSeasons);
  const addSeason = useSeasonStore((s) => s.addSeason);
  const removeSeason = useSeasonStore((s) => s.removeSeason);

  const pieces = usePieceStore((s) => s.pieces);
  const loadPieces = usePieceStore((s) => s.load);

  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  useEffect(() => {
    loadSeasons();
    if (pieces.length === 0) loadPieces();
  }, [loadSeasons, pieces.length, loadPieces]);

  async function handleCreate(data: SeasonInsert) {
    await addSeason(data);
  }

  function getPieceCount(seasonId: string) {
    return pieceSeasons.filter((ps) => ps.season_id === seasonId).length;
  }

  function formatDateRange(start: string | null, end: string | null) {
    if (!start && !end) return null;
    const fmt = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (start && end) return `${fmt(start)} – ${fmt(end)}`;
    if (start) return `From ${fmt(start)}`;
    return `Until ${fmt(end!)}`;
  }

  const deleteSeasonName = deleteTarget ? seasons.find((s) => s.id === deleteTarget)?.name : '';

  return (
    <PageContainer title="Seasons">
      <TierGate feature="seasons">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-text-secondary">
            Organize competitions, track awards, and plan your season.
          </p>
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus size={14} />
            New Season
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : seasons.length === 0 ? (
          <EmptyState
            icon={Trophy}
            title="No seasons yet"
            description="Create a season to start organizing competitions and tracking results."
            action={
              <Button onClick={() => setShowForm(true)}>
                <Plus size={14} />
                Create Your First Season
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {seasons.map((season) => {
              const pieceCount = getPieceCount(season.id);
              const dateRange = formatDateRange(season.start_date, season.end_date);
              return (
                <Link key={season.id} to={`/seasons/${season.id}`}>
                  <Card interactive className="h-full">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="flex items-center justify-center w-10 h-10 rounded-xl accent-bg-light">
                            <Trophy size={20} className="accent-text" />
                          </div>
                          <div>
                            <h3 className="text-base font-semibold text-text-primary">{season.name}</h3>
                            <p className="text-xs text-text-secondary">{season.year}</p>
                          </div>
                        </div>
                        <ArrowRight size={16} className="text-text-tertiary mt-1" />
                      </div>

                      <div className="flex items-center gap-3 text-xs text-text-secondary">
                        <span>{pieceCount} piece{pieceCount !== 1 ? 's' : ''}</span>
                        {dateRange && (
                          <>
                            <span className="text-border">|</span>
                            <span className="flex items-center gap-1">
                              <Calendar size={11} />
                              {dateRange}
                            </span>
                          </>
                        )}
                      </div>

                      {season.notes && (
                        <p className="text-xs text-text-tertiary line-clamp-2">{season.notes}</p>
                      )}
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}

        <SeasonFormModal
          open={showForm}
          onClose={() => setShowForm(false)}
          onSubmit={handleCreate}
        />

        <ConfirmDialog
          open={deleteTarget != null}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => {
            if (deleteTarget) {
              removeSeason(deleteTarget);
              setDeleteTarget(null);
            }
          }}
          title="Delete Season"
          description={`Delete "${deleteSeasonName}"? All competitions and entries in this season will also be removed.`}
          confirmLabel="Delete Season"
        />
      </TierGate>
    </PageContainer>
  );
}
