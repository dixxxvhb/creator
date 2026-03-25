import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Layers, Trophy, Users, ArrowRight, Music, Trash2 } from 'lucide-react';
import { PageContainer } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { usePieceStore } from '@/stores/pieceStore';
import { useSeasonStore } from '@/stores/seasonStore';
import { useRosterStore } from '@/stores/rosterStore';
import { useProfileStore } from '@/stores/profileStore';
import { CreatorLogo } from '@/components/branding/CreatorLogo';
import { staggerContainer, staggerItem } from '@/lib/motion';
import { TierGate } from '@/components/ui/TierGate';
import { BETA_ENABLED, RESET_TABLES } from '@/lib/beta';
import { supabase } from '@/lib/supabase';
import { toast } from '@/stores/toastStore';

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export function DashboardPage() {
  const pieces = usePieceStore((s) => s.pieces);
  const isLoading = usePieceStore((s) => s.isLoading);
  const load = usePieceStore((s) => s.load);
  const seasons = useSeasonStore((s) => s.seasons);
  const loadSeasons = useSeasonStore((s) => s.loadSeasons);
  const dancers = useRosterStore((s) => s.dancers);
  const loadRoster = useRosterStore((s) => s.load);
  const displayName = useProfileStore((s) => s.displayName);
  const studioName = useProfileStore((s) => s.studioName);
  const customGreeting = useProfileStore((s) => s.customGreeting);
  const [isResetting, setIsResetting] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    load();
    loadSeasons();
    loadRoster();
  }, [load, loadSeasons, loadRoster]);

  async function handleResetData() {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    setIsResetting(true);
    try {
      for (const table of RESET_TABLES) {
        const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (error) console.warn(`Failed to clear ${table}:`, error.message);
      }
      toast.success('All test data cleared');
      // Reload stores
      await Promise.all([load(), loadSeasons(), loadRoster()]);
    } catch {
      toast.error('Failed to clear data');
    }
    setIsResetting(false);
    setConfirmReset(false);
  }

  const greeting = customGreeting
    || (displayName ? `Welcome back, ${displayName}` : 'Welcome back');

  return (
    <PageContainer>
      <motion.div
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        {/* Hero / Greeting — spans 2 cols */}
        <motion.div variants={staggerItem} className="col-span-2 row-span-2">
          <Card className="h-full">
            <div className="flex flex-col justify-between h-full min-h-[180px] py-2">
              <div>
                {studioName && (
                  <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-[0.2em] mb-4">
                    {studioName}
                  </p>
                )}
                <div className="flex items-center gap-3 mb-3">
                  <CreatorLogo size={32} className="accent-text" />
                  <h1 className="font-display text-text-primary text-3xl font-semibold tracking-wide">
                    Creator
                  </h1>
                </div>
                <p className="text-sm text-text-tertiary">
                  Choreography, visualized.
                </p>
              </div>
              <div className="mt-6">
                <p className="text-base font-semibold text-text-primary">{greeting}</p>
                <p className="text-xs text-text-secondary mt-1">{formatDate(new Date())}</p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Stat: Pieces */}
        <motion.div variants={staggerItem}>
          <Link to="/pieces">
            <Card interactive className="h-full">
              <div className="flex flex-col items-center gap-2 py-3">
                <div className="flex items-center justify-center w-11 h-11 rounded-2xl accent-bg-light">
                  <Layers size={22} className="accent-text" />
                </div>
                <p className="text-3xl font-bold text-text-primary tracking-tight">{pieces.length}</p>
                <p className="text-xs font-medium text-text-secondary">Pieces</p>
              </div>
            </Card>
          </Link>
        </motion.div>

        {/* Stat: Seasons */}
        <motion.div variants={staggerItem}>
          <TierGate feature="home_dashboard" overlay>
            <Link to="/seasons">
              <Card interactive className="h-full">
                <div className="flex flex-col items-center gap-2 py-3">
                  <div className="flex items-center justify-center w-11 h-11 rounded-2xl accent-bg-light">
                    <Trophy size={22} className="accent-text" />
                  </div>
                  <p className="text-3xl font-bold text-text-primary tracking-tight">{seasons.length}</p>
                  <p className="text-xs font-medium text-text-secondary">Seasons</p>
                </div>
              </Card>
            </Link>
          </TierGate>
        </motion.div>

        {/* Stat: Dancers */}
        <motion.div variants={staggerItem}>
          <TierGate feature="home_dashboard" overlay>
            <Link to="/roster">
              <Card interactive className="h-full">
                <div className="flex flex-col items-center gap-2 py-3">
                  <div className="flex items-center justify-center w-11 h-11 rounded-2xl accent-bg-light">
                    <Users size={22} className="accent-text" />
                  </div>
                  <p className="text-3xl font-bold text-text-primary tracking-tight">{dancers.length}</p>
                  <p className="text-xs font-medium text-text-secondary">Dancers</p>
                </div>
              </Card>
            </Link>
          </TierGate>
        </motion.div>

        {/* Quick Action: New Piece */}
        <motion.div variants={staggerItem}>
          <Link to="/pieces/new">
            <div
              className="h-full rounded-2xl flex flex-col items-center justify-center gap-2 py-6 cursor-pointer transition-all duration-150 hover:opacity-90 active:scale-[0.98] accent-glow shadow-sm"
              style={{ backgroundColor: 'var(--color-accent)' }}
            >
              <Plus size={24} className="text-white" />
              <span className="text-sm font-semibold text-white">New Piece</span>
            </div>
          </Link>
        </motion.div>

        {/* Recent Pieces — full width */}
        <motion.div variants={staggerItem} className="col-span-2 md:col-span-4">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-base font-semibold text-text-primary">Recent Pieces</h3>
              {pieces.length > 0 && (
                <Link
                  to="/pieces"
                  className="text-xs font-medium accent-text hover:opacity-80 transition-opacity flex items-center gap-1"
                >
                  View all <ArrowRight size={12} />
                </Link>
              )}
            </div>

            {isLoading ? (
              <div className="flex justify-center py-8">
                <Spinner size="lg" />
              </div>
            ) : pieces.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-2xl bg-surface-secondary flex items-center justify-center mx-auto mb-3">
                  <Layers size={24} className="text-text-tertiary" />
                </div>
                <p className="text-sm text-text-secondary mb-4">
                  No pieces yet. Create your first piece to get started.
                </p>
                <Link to="/pieces/new">
                  <Button size="sm">
                    <Plus size={14} />
                    Create piece
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {pieces.slice(0, 3).map((piece) => (
                  <Link
                    key={piece.id}
                    to={`/pieces/${piece.id}`}
                    className="group flex items-center gap-3 p-3.5 rounded-xl bg-surface-secondary hover:bg-border-light transition-colors"
                  >
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl accent-bg-light shrink-0">
                      <Music size={18} className="accent-text" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-text-primary truncate">{piece.title}</p>
                      <p className="text-xs text-text-secondary">
                        {piece.dancer_count} dancer{piece.dancer_count !== 1 ? 's' : ''}
                        {piece.style ? ` · ${piece.style}` : ''}
                      </p>
                    </div>
                    <ArrowRight size={14} className="text-text-tertiary group-hover:text-text-secondary transition-colors shrink-0" />
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </motion.div>
        {/* Reset Test Data — beta only */}
        {BETA_ENABLED && (
          <motion.div variants={staggerItem} className="col-span-2 md:col-span-4">
            <button
              onClick={handleResetData}
              disabled={isResetting}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-border-light text-text-tertiary text-sm font-medium hover:border-danger-500 hover:text-danger-500 transition-colors disabled:opacity-50"
            >
              <Trash2 size={14} />
              {isResetting ? 'Clearing...' : confirmReset ? 'Tap again to confirm' : 'Clear all test data'}
            </button>
          </motion.div>
        )}
      </motion.div>
    </PageContainer>
  );
}
