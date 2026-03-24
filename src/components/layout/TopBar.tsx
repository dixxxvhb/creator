import { Sun, Moon } from 'lucide-react';

interface TopBarProps {
  title: string;
  onToggleSidebar?: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export function TopBar({
  title,
  theme,
  onToggleTheme,
}: TopBarProps) {
  return (
    <header className="h-14 border-b border-border-light glass flex items-center justify-between px-4 md:px-6 shrink-0">
      <h1 className="font-display text-lg font-semibold text-text-primary tracking-wide">{title}</h1>

      <button
        onClick={onToggleTheme}
        className="p-2.5 text-text-secondary hover:text-text-primary hover:bg-surface-secondary rounded-xl transition-all duration-150 min-w-[44px] min-h-[44px] flex items-center justify-center"
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>
    </header>
  );
}
