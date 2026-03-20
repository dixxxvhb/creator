import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Layers, Trophy, Users, ArrowRight, Music } from 'lucide-react';
import { PageContainer } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { usePieceStore } from '@/stores/pieceStore';
import { useProfileStore } from '@/stores/profileStore';
import { CreatorLogo } from '@/components/branding/CreatorLogo';
import { staggerContainer, staggerItem } from '@/lib/motion';

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
  const displayName = useProfileStore((s) => s.displayName);
  const studioName = useProfileStore((s) => s.studioName);
  const customGreeting = useProfileStore((s) => s.customGreeting);

  useEffect(() => {
    load();
  }, [load]);

  const greeting = customGreeting
    || (displayName ? `Welcome back, ${displayName}` : 'Welcome back');

  return (
    <PageContainer>
      <motion.div
        className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        {/* ── Hero / Greeting ── spans 2 cols */}
        <motion.div variants={staggerItem} className="col-span-2 row-span-2">
          <Card className="h-full">
            <div className="flex flex-col justify-between h-full min-h-[180px] py-2">
              <div>
                {studioName && (
                  <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-[0.2em] mb-3">
                    {studioName}
                  </p>
                )}
                <div className="flex items-center gap-3 mb-2">
                  <CreatorLogo size={32} className="text-text-primary" />
                  <h1
                    className="text-text-primary uppercase font-brand"
                    style={{ fontWeight: 200, letterSpacing: '0.25em', fontSize: '1.8rem', lineHeight: 1.1 }}
                  >
                    Creator
                  </h1>
                </div>
                <p className="text-xs text-text-tertiary tracking-wide">
                  Choreography, visualized.
                </p>
              </div>
              <div className="mt-4">
                <p className="text-base font-semibold text-text-primary">{greeting}</p>
                <p className="text-xs text-text-secondary mt-0.5">{formatDate(new Date())}</p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* ── Stat: Pieces ── */}
        <motion.div variants={staggerItem}>
          <Link to="/pieces">
            <Card className="h-full hover:border-border transition-colors cursor-pointer">
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

        {/* ── Stat: Seasons ── */}
        <motion.div variants={staggerItem}>
          <Link to="/seasons">
            <Card className="h-full hover:border-border transition-colors cursor-pointer">
              <div className="flex flex-col items-center gap-2 py-3">
                <div className="flex items-center justify-center w-11 h-11 rounded-2xl accent-bg-light">
                  <Trophy size={22} className="accent-text" />
                </div>
                <p className="text-3xl font-bold text-text-primary tracking-tight">0</p>
                <p className="text-xs font-medium text-text-secondary">Seasons</p>
              </div>
            </Card>
          </Link>
        </motion.div>

        {/* ── Stat: Dancers ── */}
        <motion.div variants={staggerItem}>
          <Link to="/roster">
            <Card className="h-full hover:border-border transition-colors cursor-pointer">
              <div className="flex flex-col items-center gap-2 py-3">
                <div className="flex items-center justify-center w-11 h-11 rounded-2xl accent-bg-light">
                  <Users size={22} className="accent-text" />
                </div>
                <p className="text-3xl font-bold text-text-primary tracking-tight">0</p>
                <p className="text-xs font-medium text-text-secondary">Dancers</p>
              </div>
            </Card>
          </Link>
        </motion.div>

        {/* ── Quick Action ── */}
        <motion.div variants={staggerItem}>
          <Link to="/pieces/new">
            <div
              className="h-full rounded-2xl flex flex-col items-center justify-center gap-2 py-6 cursor-pointer transition-all hover:opacity-90 active:scale-[0.98] accent-glow"
              style={{ backgroundColor: 'var(--color-accent)' }}
            >
              <Plus size={24} className="text-white" />
              <span className="text-sm font-semibold text-white">New Piece</span>
            </div>
          </Link>
        </motion.div>

        {/* ── Recent Pieces ── spans full width */}
        <motion.div variants={staggerItem} className="col-span-2 md:col-span-4">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-text-primary">Recent Pieces</h3>
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
              <div className="text-center py-6">
                <Layers size={28} className="mx-auto text-text-tertiary mb-2" />
                <p className="text-sm text-text-secondary mb-3">
                  No pieces yet
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
                    className="group flex items-center gap-3 p-3 rounded-xl bg-surface-secondary hover:bg-border/50 transition-colors"
                  >
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg accent-bg-light shrink-0">
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
      </motion.div>
    </PageContainer>
  );
}
