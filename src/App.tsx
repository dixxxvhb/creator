import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout';
import { DashboardPage } from '@/pages/DashboardPage';
import { PiecesPage } from '@/pages/PiecesPage';
import { PieceSetupPage } from '@/pages/PieceSetupPage';
import { PieceDetailPage } from '@/pages/PieceDetailPage';
import { RosterPage } from '@/pages/RosterPage';
import { SeasonsPage } from '@/pages/SeasonsPage';
import { SeasonDetailPage } from '@/pages/SeasonDetailPage';
import { CostumesPage } from '@/pages/CostumesPage';
import { SettingsPage } from '@/pages/SettingsPage';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="pieces" element={<PiecesPage />} />
          <Route path="pieces/new" element={<PieceSetupPage />} />
          <Route path="pieces/:id" element={<PieceDetailPage />} />
          <Route path="roster" element={<RosterPage />} />
          <Route path="seasons" element={<SeasonsPage />} />
          <Route path="seasons/:id" element={<SeasonDetailPage />} />
          <Route path="costumes" element={<CostumesPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
