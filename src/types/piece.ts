export type DanceStyle =
  | 'ballet'
  | 'jazz'
  | 'hip_hop'
  | 'contemporary'
  | 'lyrical'
  | 'tap'
  | 'modern'
  | 'musical_theater'
  | 'acro'
  | 'other'

export type GroupSize = 'solo' | 'duo' | 'trio' | 'small_group' | 'large_group'

export interface Piece {
  id: string
  name: string
  dance_style: DanceStyle
  group_size: GroupSize
  dancer_count: number
  song_title: string | null
  song_artist: string | null
  bpm: number | null
  song_length_seconds: number | null
  audio_storage_path: string | null
  created_at: string
  updated_at: string
}

export const DANCE_STYLES: { value: DanceStyle; label: string }[] = [
  { value: 'ballet', label: 'Ballet' },
  { value: 'jazz', label: 'Jazz' },
  { value: 'hip_hop', label: 'Hip Hop' },
  { value: 'contemporary', label: 'Contemporary' },
  { value: 'lyrical', label: 'Lyrical' },
  { value: 'tap', label: 'Tap' },
  { value: 'modern', label: 'Modern' },
  { value: 'musical_theater', label: 'Musical Theater' },
  { value: 'acro', label: 'Acro' },
  { value: 'other', label: 'Other' },
]

export const GROUP_SIZES: { value: GroupSize; label: string; range: string }[] = [
  { value: 'solo', label: 'Solo', range: '1' },
  { value: 'duo', label: 'Duo', range: '2' },
  { value: 'trio', label: 'Trio', range: '3' },
  { value: 'small_group', label: 'Small Group', range: '4-8' },
  { value: 'large_group', label: 'Large Group', range: '9+' },
]
