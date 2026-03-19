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
  color: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type DancerInsert = Omit<Dancer, 'id' | 'created_at' | 'updated_at' | 'user_id'>;
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
