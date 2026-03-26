// ─── Piece ───
export interface Piece {
  id: string;
  user_id: string;
  title: string;
  song_title: string | null;
  song_artist: string | null;
  style: string | null;
  group_size: string | null; // 'solo' | 'duo' | 'trio' | 'small_group' | 'large_group'
  dancer_count: number;
  bpm: number | null;
  duration_seconds: number | null;
  audio_url: string | null;
  stage_width: number;
  stage_depth: number;
  notes: string;
  sort_order: number;
  choreographer: string | null;
  focal_dancer_id: string | null;
  created_at: string;
  updated_at: string;
}

export type PieceInsert = Omit<Piece, 'id' | 'created_at' | 'updated_at' | 'user_id'>;
export type PieceUpdate = Partial<PieceInsert>;

// ─── Formation ───
export interface Formation {
  id: string;
  piece_id: string;
  index: number;
  label: string;
  timestamp_seconds: number | null;
  choreo_notes: string;
  counts_notes: string;
  transition_duration_ms: number;
  transition_easing: string;
  created_at: string;
  updated_at: string;
}

export type FormationInsert = Omit<Formation, 'id' | 'created_at' | 'updated_at'>;
export type FormationUpdate = Partial<Omit<FormationInsert, 'piece_id'>>;

// ─── Easing Options ───
export const EASING_OPTIONS = [
  { value: 'linear', label: 'Linear' },
  { value: 'ease-in', label: 'Ease In' },
  { value: 'ease-out', label: 'Ease Out' },
  { value: 'ease-in-out', label: 'Ease In-Out' },
] as const;

export type EasingType = (typeof EASING_OPTIONS)[number]['value'];

// ─── Playback Position (extends DancerPosition with opacity) ───
export interface PlaybackPosition extends DancerPosition {
  opacity: number;
}

// ─── DancerPath ───
export interface PathPoint {
  x: number;
  y: number;
}

export interface DancerPath {
  id: string;
  formation_id: string;
  dancer_label: string;
  path_points: PathPoint[];
  path_type: 'freehand' | 'geometric';
  created_at: string;
}

export type DancerPathInsert = Omit<DancerPath, 'id' | 'created_at'>;

// ─── Canvas Modes ───
export type CanvasMode = 'select' | 'draw-freehand' | 'draw-geometric';

// ─── DancerPosition ───
export interface DancerPosition {
  id: string;
  formation_id: string;
  dancer_id: string | null;
  dancer_label: string;
  x: number;
  y: number;
  color: string;
  created_at: string;
}

export type DancerPositionInsert = Omit<DancerPosition, 'id' | 'created_at'>;
export type DancerPositionUpdate = Partial<Omit<DancerPositionInsert, 'formation_id'>>;

// ─── Dancer (Global Roster) ───
export interface Dancer {
  id: string;
  user_id: string;
  full_name: string;
  short_name: string;
  birthday: string | null;
  color: string;
  is_active: boolean;
  notes: string | null;
  parent_name: string | null;
  parent_email: string | null;
  parent_phone: string | null;
  shoe_size: string | null;
  tights_size: string | null;
  height: string | null;
  created_at: string;
  updated_at: string;
}

type _DancerBase = Omit<Dancer, 'id' | 'created_at' | 'updated_at' | 'user_id'>;
type _DancerOptional = 'notes' | 'parent_name' | 'parent_email' | 'parent_phone' | 'shoe_size' | 'tights_size' | 'height';
export type DancerInsert = Omit<_DancerBase, _DancerOptional> & Partial<Pick<_DancerBase, _DancerOptional>>;
export type DancerUpdate = Partial<DancerInsert>;

// ─── Dance Styles ───
export const DANCE_STYLES = [
  'Ballet',
  'Jazz',
  'Hip Hop',
  'Contemporary',
  'Lyrical',
  'Tap',
  'Modern',
  'Musical Theatre',
  'Other',
] as const;

export type DanceStyle = (typeof DANCE_STYLES)[number];

// ─── Group Sizes ───
export const GROUP_SIZES = [
  { value: 'solo', label: 'Solo', defaultCount: 1 },
  { value: 'duo', label: 'Duo', defaultCount: 2 },
  { value: 'trio', label: 'Trio', defaultCount: 3 },
  { value: 'small_group', label: 'Small Group', defaultCount: 6 },
  { value: 'large_group', label: 'Large Group', defaultCount: 12 },
] as const;

// ─── Default dancer colors ───
export const DANCER_COLORS = [
  '#3B82F6', '#EF4444', '#22C55E', '#F59E0B', '#A855F7',
  '#EC4899', '#06B6D4', '#F97316', '#6366F1', '#14B8A6',
  '#E879F9', '#FB923C', '#38BDF8', '#4ADE80', '#FBBF24',
  '#C084FC', '#F472B6', '#2DD4BF', '#818CF8', '#34D399',
] as const;

// ─── User Profile (personalization) ───
export interface UserProfile {
  displayName: string;
  studioName: string;
  accentColor: string;
  themePreference: 'light' | 'dark' | 'system';
  customGreeting: string;
  studioLogoUrl: string | null;
  avatarUrl: string | null;
  defaultStageWidth: number;
  defaultStageDepth: number;
}

export const ACCENT_PRESETS = [
  { value: '#B4838D', label: 'Rose' },
  { value: '#8B7355', label: 'Bronze' },
  { value: '#7C6D8E', label: 'Lavender' },
  { value: '#5B8A72', label: 'Sage' },
  { value: '#C4956A', label: 'Copper' },
  { value: '#6B8FAD', label: 'Steel Blue' },
  { value: '#9B6B6B', label: 'Dusty Rose' },
  { value: '#5C7A6B', label: 'Forest' },
  { value: '#8B6B4A', label: 'Amber' },
  { value: '#6B6B7B', label: 'Slate' },
] as const;

// ─── Season ───
export interface Season {
  id: string;
  user_id: string | null;
  name: string;
  year: number;
  start_date: string | null;
  end_date: string | null;
  notes: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export type SeasonInsert = Omit<Season, 'id' | 'created_at' | 'updated_at' | 'user_id'>;
export type SeasonUpdate = Partial<SeasonInsert>;

// ─── Piece-Season join ───
export interface PieceSeason {
  id: string;
  piece_id: string;
  season_id: string;
}

// ─── Competition ───
export interface Competition {
  id: string;
  season_id: string;
  name: string;
  location: string;
  date: string | null;
  notes: string;
  company_id: string | null;
  company_name: string | null;
  entry_deadline: string | null;
  registration_url: string | null;
  scoring_system: string;
  configured_divisions: { name: string; minAge: number; maxAge: number }[];
  configured_categories: string[];
  configured_levels: string[];
  configured_styles: string[];
  created_at: string;
  updated_at: string;
}

export type CompetitionInsert = {
  season_id: string;
  name: string;
  location?: string;
  date?: string | null;
  notes?: string;
  company_id?: string | null;
  company_name?: string | null;
  entry_deadline?: string | null;
  registration_url?: string | null;
  scoring_system?: string;
  configured_divisions?: { name: string; minAge: number; maxAge: number }[];
  configured_categories?: string[];
  configured_levels?: string[];
  configured_styles?: string[];
};
export type CompetitionUpdate = Partial<Omit<CompetitionInsert, 'season_id'>>;

// ─── Competition Entry ───
export interface CompetitionEntry {
  id: string;
  competition_id: string;
  piece_id: string;
  category: string;
  placement: string | null;
  score: number | null;
  special_awards: string | null;
  notes: string;
  age_division: string | null;
  competitive_level: string | null;
  style: string | null;
  award_tier: string | null;
  choreographer: string | null;
  song_title: string | null;
  song_artist: string | null;
  time_limit_seconds: number | null;
  dancer_names: string[];
  created_at: string;
  updated_at: string;
}

export type CompetitionEntryInsert = {
  competition_id: string;
  piece_id: string;
  category?: string;
  placement?: string | null;
  score?: number | null;
  special_awards?: string | null;
  notes?: string;
  age_division?: string | null;
  competitive_level?: string | null;
  style?: string | null;
  award_tier?: string | null;
  choreographer?: string | null;
  song_title?: string | null;
  song_artist?: string | null;
  time_limit_seconds?: number | null;
  dancer_names?: string[];
};
export type CompetitionEntryUpdate = Partial<Omit<CompetitionEntryInsert, 'competition_id'>>;

// ─── Costume ───
export interface Costume {
  id: string;
  piece_id: string;
  name: string;
  description: string;
  color: string;
  image_url: string | null;
  cost: number | null;
  notes: string;
  vendor_url: string | null;
  order_status: string;
  created_at: string;
  updated_at: string;
}

export type CostumeInsert = Omit<Costume, 'id' | 'created_at' | 'updated_at'>;
export type CostumeUpdate = Partial<Omit<CostumeInsert, 'piece_id'>>;

// ─── Costume Accessory ───
export const ACCESSORY_TYPES = ['hairpiece', 'tights', 'shoes', 'jewelry', 'other'] as const;
export type AccessoryType = (typeof ACCESSORY_TYPES)[number];

export const COSTUME_ORDER_STATUSES = ['not_ordered', 'ordered', 'arrived', 'needs_alteration', 'ready'] as const;
export type CostumeOrderStatus = (typeof COSTUME_ORDER_STATUSES)[number];

export interface CostumeAccessory {
  id: string;
  costume_id: string;
  accessory_type: AccessoryType;
  description: string;
  color: string;
  link: string | null;
  created_at: string;
}

export type CostumeAccessoryInsert = Omit<CostumeAccessory, 'id' | 'created_at'>;

// ─── Costume Assignment ───
export const COSTUME_STATUSES = ['needed', 'ordered', 'received', 'altered', 'ready'] as const;
export type CostumeStatus = (typeof COSTUME_STATUSES)[number];

export interface CostumeAssignment {
  id: string;
  costume_id: string;
  dancer_id: string;
  size: string;
  alteration_notes: string;
  status: CostumeStatus;
}

export type CostumeAssignmentInsert = Omit<CostumeAssignment, 'id'>;
export type CostumeAssignmentUpdate = Partial<Omit<CostumeAssignmentInsert, 'costume_id' | 'dancer_id'>>;

// ─── Prop ───
export interface Prop {
  id: string;
  piece_id: string;
  name: string;
  quantity: number;
  cost: number | null;
  notes: string;
  created_at: string;
  updated_at: string;
}

export type PropInsert = Omit<Prop, 'id' | 'created_at' | 'updated_at'>;
export type PropUpdate = Partial<Omit<PropInsert, 'piece_id'>>;

// ─── Song Section ───
export const SECTION_TYPES = [
  'Intro', 'Verse', 'Pre-Chorus', 'Chorus', 'Bridge', 'Outro', 'Break', 'Custom',
] as const;

export type SectionType = (typeof SECTION_TYPES)[number];

export interface SongSection {
  id: string;
  piece_id: string;
  label: string;
  section_type: SectionType;
  start_seconds: number;
  end_seconds: number;
  formation_id: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export type SongSectionInsert = Omit<SongSection, 'id' | 'created_at' | 'updated_at'>;
export type SongSectionUpdate = Partial<Omit<SongSectionInsert, 'piece_id'>>;

// ─── Competition Companies & Config ───
export interface CompetitionCompany {
  id: string;
  name: string;
  shortName: string;
  website: string;
  type: 'competition' | 'convention' | 'both';
  scoringSystem: 'tiered' | 'ranked' | 'both';
  defaultDivisions: { name: string; minAge: number; maxAge: number }[];
  defaultCategories: string[];
  defaultLevels: string[];
  defaultStyles: string[];
}

export const AWARD_TIERS = [
  'Platinum', 'High Gold', 'Gold', 'High Silver', 'Silver', 'Bronze',
] as const;

export type AwardTier = (typeof AWARD_TIERS)[number];

export const ENTRY_CATEGORIES = [
  'Solo', 'Duo', 'Trio', 'Small Group', 'Large Group', 'Line', 'Production', 'Super Group',
] as const;

export type EntryCategory = (typeof ENTRY_CATEGORIES)[number];

export const COMPETITIVE_LEVELS = [
  'Recreational', 'Intermediate', 'Competitive', 'Elite',
] as const;

export type CompetitiveLevel = (typeof COMPETITIVE_LEVELS)[number];

// ─── Tier System ───
export type Tier = 'free' | 'mid' | 'studio';

export const TIER_LABELS: Record<Tier, string> = {
  free: 'Free',
  mid: 'Choreographer',
  studio: 'Studio',
};

export const TIER_FEATURES = {
  // Navigation sections
  home_dashboard: 'studio',
  seasons: 'studio',
  roster: 'studio',
  costumes: 'studio',
  // Canvas features
  transition_animations: 'mid',
  drawn_pathways: 'mid',
  // Piece limits
  unlimited_pieces: 'mid',
  shows: 'studio',
} as const satisfies Record<string, Tier>;

export type TierFeature = keyof typeof TIER_FEATURES;

export const FREE_PIECE_LIMIT = 2;

// ─── Bug Reports ───
export type BugSeverity = 'minor' | 'major' | 'blocker';
export type BugStatus = 'open' | 'resolved' | 'dismissed';

export interface BugReport {
  id: string;
  user_id: string;
  user_email: string;
  description: string;
  expected: string | null;
  severity: BugSeverity;
  page_url: string | null;
  screen_width: number | null;
  screen_height: number | null;
  user_agent: string | null;
  app_version: string | null;
  status: BugStatus;
  created_at: string;
}

export type BugReportInsert = Pick<BugReport, 'description' | 'severity'> & {
  user_email: string;
  expected?: string | null;
  page_url?: string | null;
  screen_width?: number | null;
  screen_height?: number | null;
  user_agent?: string | null;
  app_version?: string | null;
};

// ─── Show ───
export interface Show {
  id: string;
  season_id: string;
  user_id: string;
  name: string;
  date: string | null;
  venue: string;
  notes: string;
  buffer_acts: number;
  created_at: string;
  updated_at: string;
}
export type ShowInsert = Omit<Show, 'id' | 'created_at' | 'updated_at' | 'user_id'>;
export type ShowUpdate = Partial<Omit<ShowInsert, 'season_id'>>;

// ─── ShowAct ───
export interface ShowAct {
  id: string;
  show_id: string;
  piece_id: string;
  act_number: number;
  intermission_before: boolean;
  notes: string;
  created_at: string;
}
export type ShowActInsert = Omit<ShowAct, 'id' | 'created_at'>;
export type ShowActUpdate = Partial<Omit<ShowActInsert, 'show_id'>>;
