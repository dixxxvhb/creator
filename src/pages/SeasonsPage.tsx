import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trophy, Calendar, ArrowRight, Trash2 } from 'lucide-react';
import { PageContainer } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { SeasonFormModal } from '@/components/seasons/SeasonFormModal';
import { useSeasonStore } from '@/stores/seasonStore';
import { usePieceStore } from '@/stores/pieceStore';
import type { SeasonInsert } from '@/types';

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
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

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

  return (
    <PageContainer title="Seasons">
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
        <Card className="text-center py-12">
          <Trophy size={40} className="mx-auto text-text-tertiary mb-4" />
          <h3 className="text-lg font-semibold text-text-primary mb-2">No seasons yet</h3>
          <p className="text-sm text-text-tertiary max-w-md mx-auto mb-4">
            Create a season to start organizing competitions and tracking results.
          </p>
          <Button onClick={() => setShowForm(true)}>
            <Plus size={14} />
            Create Season
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {seasons.map((season) => {
            const pieceCount = getPieceCount(season.id);
            const dateRange = formatDateRange(season.start_date, season.end_date);
            return (
              <div key={season.id} className="relative group">
                <Link to={`/seasons/${season.id}`}>
                  <Card className="h-full hover:border-border transition-colors cursor-pointer">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center justify-center w-10 h-10 rounded-xl accent-bg-light">
                            <Trophy size={20} className="accent-text" />
                          </div>
                          <div>
                            <h3 className="text-base font-semibold text-text-primary">{season.name}</h3>
                            <p className="text-xs text-text-secondary">{season.year}</p>
                          </div>
                        </div>
                        <ArrowRight size={16} className="text-text-tertiary group-hover:text-text-secondary transition-colors mt-1" />
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

                {/* Delete button */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (deleteConfirm === season.id) {
                      removeSeason(season.id);
                      setDeleteConfirm(null);
                    } else {
                      setDeleteConfirm(season.id);
                    }
                  }}
                  onBlur={() => setDeleteConfirm(null)}
                  className="absolute top-3 right-10 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 text-text-tertiary hover:text-danger-500 hover:bg-surface-secondary transition-all"
                  title={deleteConfirm === season.id ? 'Click again to confirm' : 'Delete season'}
                >
                  <Trash2 size={14} className={deleteConfirm === season.id ? 'text-danger-500' : ''} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <SeasonFormModal
        open={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleCreate}
      />
    </PageContainer>
  );
}
