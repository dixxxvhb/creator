import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Music,
  Users,
  Trophy,
  Settings,
  Lock,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTierStore } from '@/stores/tierStore';
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
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function BottomTabBar() {
  const hasFeature = useTierStore((s) => s.hasFeature);

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass border-t border-border/50 safe-bottom">
      <div className="flex items-center justify-around px-2 py-1">
        {tabs.map(({ to, label, icon: Icon, tierFeature }) => {
          const locked = tierFeature ? !hasFeature(tierFeature) : false;
          return (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg min-w-[56px] transition-colors',
                  isActive
                    ? 'accent-text'
                    : 'text-text-tertiary',
                )
              }
            >
              <Icon size={22} />
              <span className="text-[10px] font-medium">{label}</span>
              {locked && (
                <Lock
                  size={8}
                  className="absolute top-1 right-2 text-text-tertiary"
                />
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
