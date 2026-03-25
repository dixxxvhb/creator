import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Calendar, MapPin, ArrowRight, Clapperboard } from 'lucide-react';
import { PageContainer } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { ShowFormModal } from '@/components/shows/ShowFormModal';
import { useShowStore } from '@/stores/showStore';
import { useSeasonStore } from '@/stores/seasonStore';
import type { ShowInsert } from '@/types';

export function ShowsPage() {
  const shows = useShowStore((s) => s.shows);
  const loadAllShows = useShowStore((s) => s.loadAllShows);
  const addShow = useShowStore((s) => s.addShow);
  const isLoading = useShowStore((s) => s.isLoading);

  const seasons = useSeasonStore((s) => s.seasons);
  const loadSeasons = useSeasonStore((s) => s.loadSeasons);

  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadAllShows();
    if (seasons.length === 0) loadSeasons();
  }, [loadAllShows, seasons.length, loadSeasons]);

  function formatDate(d: string | null) {
    if (!d) return null;
    return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function getSeasonName(seasonId: string) {
    return seasons.find((s) => s.id === seasonId)?.name ?? 'Unknown Season';
  }

  if (isLoading && shows.length === 0) {
    return <PageContainer><div className="flex items-center justify-center py-20"><Spinner /></div></PageContainer>;
  }

  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-text-primary">Shows</h1>
          <p className="text-sm text-text-secondary mt-0.5">{shows.length} show{shows.length !== 1 ? 's' : ''}</p>
        </div>
        {seasons.length > 0 && (
          <Button size="sm" onClick={() => setShowForm(true)}><Plus size={14} />Add</Button>
        )}
      </div>

      {shows.length === 0 ? (
        <EmptyState
          icon={Clapperboard}
          title="No shows yet"
          description={seasons.length === 0 ? 'Create a season first, then add shows.' : 'Add your first show to start building your program.'}
          action={seasons.length > 0 ? (
            <Button size="sm" onClick={() => setShowForm(true)}><Plus size={14} />Add Show</Button>
          ) : (
            <Link to="/seasons"><Button size="sm" variant="secondary">Go to Seasons</Button></Link>
          )}
        />
      ) : (
        <div className="space-y-3">
          {shows.map((show) => (
            <Link key={show.id} to={`/shows/${show.id}`} className="block">
              <Card className="flex flex-col gap-2 hover:border-[var(--color-accent)]/30 transition-colors cursor-pointer">
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-text-primary truncate">{show.name}</h3>
                    <p className="text-xs text-text-secondary mt-0.5">{getSeasonName(show.season_id)}</p>
                  </div>
                  <ArrowRight size={14} className="text-text-tertiary shrink-0 mt-1" />
                </div>
                <div className="flex items-center gap-4 text-xs text-text-secondary">
                  {show.date && (
                    <span className="flex items-center gap-1"><Calendar size={12} />{formatDate(show.date)}</span>
                  )}
                  {show.venue && (
                    <span className="flex items-center gap-1"><MapPin size={12} />{show.venue}</span>
                  )}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {showForm && seasons.length > 0 && (
        <ShowFormModal
          open={showForm}
          onClose={() => setShowForm(false)}
          onSubmit={async (data: ShowInsert) => {
            await addShow(data);
            setShowForm(false);
          }}
          seasons={seasons.map(s => ({ id: s.id, name: s.name }))}
        />
      )}
    </PageContainer>
  );
}
