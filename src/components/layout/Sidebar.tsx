import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Music,
  Users,
  Trophy,
  Award,
  Shirt,
  Settings,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CreatorLogo } from '@/components/branding/CreatorLogo';
import { useTierStore } from '@/stores/tierStore';
import { TIER_LABELS, TIER_FEATURES } from '@/types';
import type { TierFeature } from '@/types';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  tierFeature?: TierFeature;
}

const navItems: NavItem[] = [
  { to: '/', label: 'Home', icon: LayoutDashboard, tierFeature: 'home_dashboard' },
  { to: '/pieces', label: 'Pieces', icon: Music },
  { to: '/roster', label: 'Roster', icon: Users, tierFeature: 'roster' },
  { to: '/seasons', label: 'Seasons', icon: Trophy, tierFeature: 'seasons' },
  { to: '/competitions', label: 'Competitions', icon: Award, tierFeature: 'seasons' },
  { to: '/costumes', label: 'Costumes', icon: Shirt, tierFeature: 'costumes' },
];

const bottomItems: NavItem[] = [
  { to: '/settings', label: 'Settings', icon: Settings },
];

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const hasFeature = useTierStore((s) => s.hasFeature);

  function renderNavItem({ to, label, icon: Icon, tierFeature }: NavItem) {
    const locked = tierFeature ? !hasFeature(tierFeature) : false;
    return (
      <NavLink
        key={to}
        to={to}
        end={to === '/'}
        onClick={onNavigate}
        className={({ isActive }) =>
          cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
            isActive
              ? 'accent-bg-light accent-text'
              : 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary',
          )
        }
      >
        <Icon size={18} strokeWidth={1.75} />
        {label}
        {locked && tierFeature && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-surface-secondary text-text-tertiary ml-auto">
            {TIER_LABELS[TIER_FEATURES[tierFeature]].toUpperCase()}
          </span>
        )}
      </NavLink>
    );
  }

  return (
    <aside className="w-52 glass border-r border-border-light h-screen flex flex-col shrink-0">
      {/* Brand */}
      <div className="px-4 py-5 flex items-center gap-2.5">
        <CreatorLogo size={22} className="accent-text" />
        <span className="font-display text-text-primary text-lg font-semibold tracking-wide">
          Creator
        </span>
      </div>

      {/* Main nav */}
      <nav className="flex-1 px-3 py-2 space-y-1">
        {navItems.map(renderNavItem)}
      </nav>

      {/* Bottom nav + version */}
      <div className="px-3 py-2 space-y-1 border-t border-border-light">
        {bottomItems.map(renderNavItem)}
        <div className="px-3 py-2">
          <p className="text-[10px] text-text-tertiary font-medium tracking-wider uppercase">v0.1.0</p>
        </div>
      </div>
    </aside>
  );
}
