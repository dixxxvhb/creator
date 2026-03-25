import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { DashboardPage } from '@/pages/DashboardPage';
import { PiecesPage } from '@/pages/PiecesPage';
import { PieceSetupPage } from '@/pages/PieceSetupPage';
import { PieceDetailPage } from '@/pages/PieceDetailPage';
import { RosterPage } from '@/pages/RosterPage';
import { SeasonsPage } from '@/pages/SeasonsPage';
import { SeasonDetailPage } from '@/pages/SeasonDetailPage';
import { CompetitionsPage } from '@/pages/CompetitionsPage';
import { CostumesPage } from '@/pages/CostumesPage';
import { ShowsPage } from '@/pages/ShowsPage';
import { ShowDetailPage } from '@/pages/ShowDetailPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { RehearsalPage } from '@/pages/RehearsalPage';
import { BackstagePage } from '@/pages/BackstagePage';
import { useAuthStore } from '@/stores/authStore';

export function App() {
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <AuthGuard>
      <BrowserRouter basename="/creator">
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
      </BrowserRouter>
    </AuthGuard>
  );
}
