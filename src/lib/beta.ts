// Beta testing configuration
// Flip BETA_ENABLED to false for public launch

export const BETA_ENABLED = true;
export const ACCESS_CODE = 'CREATOR2026';
export const ADMIN_EMAIL = 'dancewithdixon@gmail.com';
export const APP_VERSION = '0.1.0';

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
