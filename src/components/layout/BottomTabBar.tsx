import { useState, useRef, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Music,
  Users,
  Trophy,
  Settings,
  Lock,
  MoreHorizontal,
  Swords,
  Shirt,
  Theater,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTierStore } from '@/stores/tierStore';
import { toast } from '@/stores/toastStore';
import { TIER_LABELS, TIER_FEATURES } from '@/types';
import type { TierFeature } from '@/types';

interface TabItem {
  to: string;
  label: string;
  icon: LucideIcon;
  tierFeature?: TierFeature;
}

const tabs: TabItem[] = [
  { to: '/', label: 'Home', icon: LayoutDashboard, tierFeature: 'home_dashboard' },
  { to: '/pieces', label: 'Pieces', icon: Music },
  { to: '/roster', label: 'Roster', icon: Users, tierFeature: 'roster' },
  { to: '/seasons', label: 'Seasons', icon: Trophy, tierFeature: 'seasons' },
];

const moreItems: TabItem[] = [
  { to: '/competitions', label: 'Competitions', icon: Swords },
  { to: '/costumes', label: 'Costumes', icon: Shirt, tierFeature: 'costumes' },
  { to: '/shows', label: 'Shows', icon: Theater, tierFeature: 'shows' },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function BottomTabBar() {
  const hasFeature = useTierStore((s) => s.hasFeature);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  // Close popover on route change
  useEffect(() => {
    setMoreOpen(false);
  }, [location.pathname]);

  // Close popover on outside click
  useEffect(() => {
    if (!moreOpen) return;
    function handleClick(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [moreOpen]);

  const isMoreActive = moreItems.some((item) => location.pathname.startsWith(item.to));

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass border-t border-border-light safe-bottom">
      <div className="flex items-center justify-around px-2 py-1.5">
        {tabs.map(({ to, label, icon: Icon, tierFeature }) => {
          const locked = tierFeature ? !hasFeature(tierFeature) : false;

          if (locked && tierFeature) {
            return (
              <button
                key={to}
                onClick={() => toast.info(`Upgrade to ${TIER_LABELS[TIER_FEATURES[tierFeature]]} to access ${label}`)}
                className={cn(
                  'relative flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl min-w-[60px] min-h-[44px] transition-colors',
                  'text-text-tertiary cursor-not-allowed',
                )}
              >
                <Icon size={22} strokeWidth={1.75} />
                <span className="text-[11px] font-medium">{label}</span>
                <Lock size={8} className="absolute top-1 right-2 text-text-tertiary" />
              </button>
            );
          }

          return (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'relative flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl min-w-[60px] min-h-[44px] transition-colors',
                  isActive
                    ? 'accent-text'
                    : 'text-text-tertiary',
                )
              }
            >
              <Icon size={22} strokeWidth={1.75} />
              <span className="text-[11px] font-medium">{label}</span>
            </NavLink>
          );
        })}

        {/* More menu */}
        <div ref={moreRef} className="relative">
          <button
            onClick={() => setMoreOpen((v) => !v)}
            className={cn(
              'relative flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl min-w-[60px] min-h-[44px] transition-colors',
              isMoreActive ? 'accent-text' : 'text-text-tertiary',
            )}
          >
            <MoreHorizontal size={22} strokeWidth={1.75} />
            <span className="text-[11px] font-medium">More</span>
          </button>

          {moreOpen && (
            <div className="absolute bottom-full right-0 mb-2 w-48 bg-surface-elevated border border-border-light rounded-xl shadow-lg overflow-hidden">
              {moreItems.map(({ to, label, icon: Icon, tierFeature }) => {
                const locked = tierFeature ? !hasFeature(tierFeature) : false;

                if (locked && tierFeature) {
                  return (
                    <button
                      key={to}
                      onClick={() => toast.info(`Upgrade to ${TIER_LABELS[TIER_FEATURES[tierFeature]]} to access ${label}`)}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 text-sm transition-colors w-full',
                        'text-text-tertiary cursor-not-allowed',
                      )}
                    >
                      <Icon size={18} strokeWidth={1.75} />
                      <span>{label}</span>
                      <Lock size={12} className="ml-auto text-text-tertiary" />
                    </button>
                  );
                }

                return (
                  <NavLink
                    key={to}
                    to={to}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 px-4 py-3 text-sm transition-colors',
                        isActive
                          ? 'accent-text bg-surface-secondary'
                          : 'text-text-secondary hover:bg-surface-secondary',
                      )
                    }
                  >
                    <Icon size={18} strokeWidth={1.75} />
                    <span>{label}</span>
                  </NavLink>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
