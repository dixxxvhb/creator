import { supabase } from '@/config/supabase'
import type { Formation } from '@/types/formation'

export async function loadFormations(pieceId: string): Promise<Formation[]> {
  const { data, error } = await supabase
    .from('formations')
    .select()
    .eq('piece_id', pieceId)
    .order('order_index', { ascending: true })

  if (error) throw error
  return data
}

export async function saveFormations(
  pieceId: string,
  formations: Formation[],
): Promise<void> {
  // Delete existing formations for this piece, then insert all current ones
  const { error: deleteError } = await supabase
    .from('formations')
    .delete()
    .eq('piece_id', pieceId)

  if (deleteError) throw deleteError

  if (formations.length === 0) return

  const rows = formations.map((f) => ({
    id: f.id,
    piece_id: pieceId,
    name: f.name,
    order_index: f.order_index,
    dancer_positions: f.dancer_positions,
    timestamp_seconds: f.timestamp_seconds,
  }))

  const { error: insertError } = await supabase
    .from('formations')
    .insert(rows)

  if (insertError) throw insertError
}
