export interface DancerPosition {
  dancer_id: string
  label: string
  x: number // 0-1 normalized
  y: number // 0-1 normalized
  color: string
}

export interface Formation {
  id: string
  piece_id?: string
  name: string
  order_index: number
  dancer_positions: DancerPosition[]
  timestamp_seconds: number | null
  created_at?: string
  updated_at?: string
}
