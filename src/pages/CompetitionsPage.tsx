import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, MapPin, Calendar, ArrowRight, Trophy } from 'lucide-react';
import { PageContainer } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { CompetitionFormModal } from '@/components/seasons/CompetitionFormModal';
import { useSeasonStore } from '@/stores/seasonStore';
import type { CompetitionInsert } from '@/types';

export function CompetitionsPage() {
  const competitions = useSeasonStore((s) => s.competitions);
  const seasons = useSeasonStore((s) => s.seasons);
  const loadAllCompetitions = useSeasonStore((s) => s.loadAllCompetitions);
  const loadSeasons = useSeasonStore((s) => s.loadSeasons);
  const addCompetition = useSeasonStore((s) => s.addCompetition);
  const isLoading = useSeasonStore((s) => s.isLoading);

  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadAllCompetitions();
    if (seasons.length === 0) loadSeasons();
  }, [loadAllCompetitions, seasons.length, loadSeasons]);

  function formatDate(d: string | null) {
    if (!d) return null;
    return new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  function getSeasonName(seasonId: string) {
    return seasons.find((s) => s.id === seasonId)?.name ?? 'Unknown Season';
  }

  if (isLoading && competitions.length === 0) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center py-20">
          <Spinner />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-text-primary">Competitions</h1>
          <p className="text-sm text-text-secondary mt-0.5">
            {competitions.length} competition{competitions.length !== 1 ? 's' : ''}
          </p>
        </div>
        {seasons.length > 0 && (
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus size={14} />
            Add
          </Button>
        )}
      </div>

      {competitions.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="No competitions yet"
          description={
            seasons.length === 0
              ? 'Create a season first, then add competitions to it.'
              : 'Add your first competition to start tracking entries and results.'
          }
          action={
            seasons.length > 0 ? (
              <Button size="sm" onClick={() => setShowForm(true)}>
                <Plus size={14} />
                Add Competition
              </Button>
            ) : (
              <Link to="/seasons">
                <Button size="sm" variant="secondary">Go to Seasons</Button>
              </Link>
            )
          }
        />
      ) : (
        <div className="space-y-3">
          {competitions.map((comp) => (
            <Card key={comp.id} className="flex flex-col gap-2">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-text-primary truncate">
                    {comp.name}
                  </h3>
                  <p className="text-xs text-text-secondary mt-0.5">
                    {getSeasonName(comp.season_id)}
                  </p>
                </div>
                <Link
                  to={`/seasons/${comp.season_id}`}
                  className="text-text-tertiary hover:text-text-primary transition-colors shrink-0"
                >
                  <ArrowRight size={14} />
                </Link>
              </div>
              <div className="flex items-center gap-4 text-xs text-text-secondary">
                {comp.date && (
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {formatDate(comp.date)}
                  </span>
                )}
                {comp.location && (
                  <span className="flex items-center gap-1">
                    <MapPin size={12} />
                    {comp.location}
                  </span>
                )}
              </div>
              {comp.notes && (
                <p className="text-xs text-text-tertiary line-clamp-2">{comp.notes}</p>
              )}
            </Card>
          ))}
        </div>
      )}

      {showForm && seasons.length > 0 && (
        <CompetitionFormModal
          open={showForm}
          onClose={() => setShowForm(false)}
          onSubmit={async (data: CompetitionInsert) => {
            await addCompetition(data);
            setShowForm(false);
          }}
          seasonId={seasons[0].id}
        />
      )}
    </PageContainer>
  );
}
