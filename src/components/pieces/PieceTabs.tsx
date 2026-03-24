import { cn } from '@/lib/utils';

const TABS = [
  { id: 'canvas', label: 'Canvas' },
  { id: 'notes', label: 'Notes' },
  { id: 'sections', label: 'Song Sections' },
  { id: 'roster', label: 'Roster' },
] as const;

export type PieceTab = (typeof TABS)[number]['id'];

interface PieceTabsProps {
  activeTab: PieceTab;
  onTabChange: (tab: PieceTab) => void;
}

export function PieceTabs({ activeTab, onTabChange }: PieceTabsProps) {
  return (
    <div className="flex gap-0 border-b border-border overflow-x-auto scrollbar-none">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            'px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors relative',
            activeTab === tab.id
              ? 'accent-text'
              : 'text-text-secondary hover:text-text-primary',
          )}
        >
          {tab.label}
          {activeTab === tab.id && (
            <span
              className="absolute bottom-0 left-0 right-0 h-0.5"
              style={{ backgroundColor: 'var(--color-accent)' }}
            />
          )}
        </button>
      ))}
    </div>
  );
}
