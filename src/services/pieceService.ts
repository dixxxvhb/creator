import { supabase } from '@/config/supabase'
import type { Piece, DanceStyle, GroupSize } from '@/types/piece'

export interface CreatePieceInput {
  name: string
  dance_style: DanceStyle
  group_size: GroupSize
  dancer_count: number
  song_title: string | null
  song_artist: string | null
  bpm: number | null
  song_length_seconds: number | null
  audio_storage_path: string | null
}

export async function createPiece(input: CreatePieceInput): Promise<Piece> {
  const { data, error } = await supabase
    .from('pieces')
    .insert(input)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getPiece(id: string): Promise<Piece> {
  const { data, error } = await supabase
    .from('pieces')
    .select()
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function listPieces(): Promise<Piece[]> {
  const { data, error } = await supabase
    .from('pieces')
    .select()
    .order('updated_at', { ascending: false })

  if (error) throw error
  return data
}

export async function deletePiece(id: string): Promise<void> {
  const { error } = await supabase
    .from('pieces')
    .delete()
    .eq('id', id)

  if (error) throw error
}
