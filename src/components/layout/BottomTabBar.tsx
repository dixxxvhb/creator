import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Music,
  Users,
  Trophy,
  Settings,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TabItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

const tabs: TabItem[] = [
  { to: '/', label: 'Home', icon: LayoutDashboard },
  { to: '/pieces', label: 'Pieces', icon: Music },
  { to: '/roster', label: 'Roster', icon: Users },
  { to: '/seasons', label: 'Seasons', icon: Trophy },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function BottomTabBar() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass border-t border-border/50 safe-bottom">
      <div className="flex items-center justify-around px-2 py-1">
        {tabs.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg min-w-[56px] transition-colors',
                isActive
                  ? 'accent-text'
                  : 'text-text-tertiary',
              )
            }
          >
            <Icon size={22} />
            <span className="text-[10px] font-medium">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
