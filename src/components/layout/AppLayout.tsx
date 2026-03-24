import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Toaster } from 'sonner';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { BottomTabBar } from './BottomTabBar';
import { useProfileStore } from '@/stores/profileStore';
import { pageVariants, pageTransition } from '@/lib/motion';

const routeTitles: Record<string, string> = {
  '/': 'Home',
  '/pieces': 'Pieces',
  '/roster': 'Roster',
  '/seasons': 'Seasons',
  '/costumes': 'Costumes',
  '/settings': 'Settings',
};

export function AppLayout() {
  const location = useLocation();
  const themePreference = useProfileStore((s) => s.themePreference);
  const setTheme = useProfileStore((s) => s.setTheme);
  const initProfile = useProfileStore((s) => s.initProfile);

  const pageTitle = routeTitles[location.pathname] ?? 'Creator';

  const effectiveTheme: 'dark' | 'light' =
    themePreference === 'system'
      ? (typeof window !== 'undefined' &&
          window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light')
      : themePreference;

  useEffect(() => {
    initProfile();
  }, [initProfile]);

  function toggleTheme() {
    setTheme(effectiveTheme === 'dark' ? 'light' : 'dark');
  }

  return (
    <div className="flex h-dvh overflow-hidden bg-surface">
      {/* Desktop sidebar */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar
          title={pageTitle}
          onToggleSidebar={() => {}}
          theme={effectiveTheme}
          onToggleTheme={toggleTheme}
        />
        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageTransition}
              className="min-h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile bottom tabs */}
      <BottomTabBar />

      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: 'var(--color-surface-elevated)',
            border: '1px solid var(--color-border-light)',
            color: 'var(--color-text-primary)',
          },
        }}
      />
    </div>
  );
}
