// Beta testing configuration
// Flip BETA_ENABLED to false for public launch

export const BETA_ENABLED = true;
export const ACCESS_CODE = 'CREATOR2026';
export const ADMIN_EMAIL = 'dancewithdixon@gmail.com';
export const APP_VERSION = '0.1.0';

// Local dev convenience: skip the access code + login when running `npm run dev`.
// Auto-signs-in a throwaway account so RLS-scoped data works without typing
// credentials. Guarded by import.meta.env.DEV in authStore, so it is STRIPPED
// from production builds — the deployed site still shows the real gate.
// Flip to false to exercise the real auth flow locally.
export const DEV_AUTOLOGIN = true;
export const DEV_ACCOUNT = { email: 'dev@creator.local', password: 'creator-dev-2026' };

// Tables to clear when resetting test data (order matters — children before parents)
export const RESET_TABLES = [
  'bug_reports',
  'show_acts',
  'shows',
  'song_sections',
  'dancer_paths',
  'dancer_positions',
  'formations',
  'pieces',
  'costume_accessories',
  'costume_assignments',
  'props',
  'costumes',
  'competition_entries',
  'piece_seasons',
  'competitions',
  'seasons',
  'dancers',
] as const;
