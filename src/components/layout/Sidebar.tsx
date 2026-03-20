import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Music,
  Users,
  Trophy,
  Shirt,
  Settings,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CreatorLogo } from '@/components/branding/CreatorLogo';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { to: '/', label: 'Home', icon: LayoutDashboard },
  { to: '/pieces', label: 'Pieces', icon: Music },
  { to: '/roster', label: 'Roster', icon: Users },
  { to: '/seasons', label: 'Seasons', icon: Trophy },
  { to: '/costumes', label: 'Costumes', icon: Shirt },
  { to: '/settings', label: 'Settings', icon: Settings },
];

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  return (
    <aside className="w-48 glass border-r border-border/50 h-screen flex flex-col shrink-0">
      <div className="px-4 py-4 flex items-center gap-2">
        <CreatorLogo size={20} className="text-text-primary" />
        <span
          className="text-text-primary uppercase font-brand"
          style={{ fontWeight: 200, letterSpacing: '0.25em', fontSize: '0.9rem' }}
        >
          Creator
        </span>
      </div>

      <nav className="flex-1 px-2 py-2 space-y-0.5">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'accent-bg-light accent-text'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary',
              )
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-2.5 border-t border-border">
        <p className="text-xs text-text-tertiary">v0.1.0</p>
      </div>
    </aside>
  );
}
