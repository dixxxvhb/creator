import { useEffect, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { useAuthStore } from '@/stores/authStore';

// Lazy-load all pages for code splitting
const DashboardPage = lazy(() => import('@/pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const PiecesPage = lazy(() => import('@/pages/PiecesPage').then(m => ({ default: m.PiecesPage })));
const PieceSetupPage = lazy(() => import('@/pages/PieceSetupPage').then(m => ({ default: m.PieceSetupPage })));
const PieceDetailPage = lazy(() => import('@/pages/PieceDetailPage').then(m => ({ default: m.PieceDetailPage })));
const RosterPage = lazy(() => import('@/pages/RosterPage').then(m => ({ default: m.RosterPage })));
const SeasonsPage = lazy(() => import('@/pages/SeasonsPage').then(m => ({ default: m.SeasonsPage })));
const SeasonDetailPage = lazy(() => import('@/pages/SeasonDetailPage').then(m => ({ default: m.SeasonDetailPage })));
const CompetitionsPage = lazy(() => import('@/pages/CompetitionsPage').then(m => ({ default: m.CompetitionsPage })));
const CostumesPage = lazy(() => import('@/pages/CostumesPage').then(m => ({ default: m.CostumesPage })));
const ShowsPage = lazy(() => import('@/pages/ShowsPage').then(m => ({ default: m.ShowsPage })));
const ShowDetailPage = lazy(() => import('@/pages/ShowDetailPage').then(m => ({ default: m.ShowDetailPage })));
const SettingsPage = lazy(() => import('@/pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const RehearsalPage = lazy(() => import('@/pages/RehearsalPage').then(m => ({ default: m.RehearsalPage })));
const BackstagePage = lazy(() => import('@/pages/BackstagePage').then(m => ({ default: m.BackstagePage })));
const ViewerPage = lazy(() => import('@/pages/ViewerPage').then(m => ({ default: m.ViewerPage })));

function AuthenticatedApp() {
  return (
    <AuthGuard>
      <Routes>
        <Route path="shows/:id/backstage" element={<BackstagePage />} />
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="pieces" element={<PiecesPage />} />
          <Route path="pieces/new" element={<PieceSetupPage />} />
          <Route path="pieces/:id" element={<PieceDetailPage />} />
          <Route path="pieces/:id/rehearse" element={<RehearsalPage />} />
          <Route path="roster" element={<RosterPage />} />
          <Route path="seasons" element={<SeasonsPage />} />
          <Route path="seasons/:id" element={<SeasonDetailPage />} />
          <Route path="competitions" element={<CompetitionsPage />} />
          <Route path="costumes" element={<CostumesPage />} />
          <Route path="shows" element={<ShowsPage />} />
          <Route path="shows/:id" element={<ShowDetailPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthGuard>
  );
}

export function App() {
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <BrowserRouter basename="/creator">
      <Routes>
        <Route path="/view/:token" element={<ViewerPage />} />
        <Route path="/*" element={<AuthenticatedApp />} />
      </Routes>
    </BrowserRouter>
  );
}
