import { supabase } from '@/lib/supabase';
import { toast } from '@/stores/toastStore';
import type { DancerPosition, DancerPositionInsert, DancerPositionUpdate } from '@/types';

export async function fetchPositions(formationId: string): Promise<DancerPosition[]> {
  const { data, error } = await supabase
    .from('dancer_positions')
    .select('*')
    .eq('formation_id', formationId);
  if (error) throw new Error(`Failed to fetch positions: ${error.message}`);
  return data;
}

export async function fetchPositionsBatch(
  formationIds: string[]
): Promise<Record<string, DancerPosition[]>> {
  if (formationIds.length === 0) return {};

  const { data, error } = await supabase
    .from('dancer_positions')
    .select('*')
    .in('formation_id', formationIds);
  if (error) throw new Error(`Failed to fetch positions batch: ${error.message}`);

  const grouped: Record<string, DancerPosition[]> = {};
  for (const pos of data) {
    if (!grouped[pos.formation_id]) {
      grouped[pos.formation_id] = [];
    }
    grouped[pos.formation_id].push(pos);
  }
  return grouped;
}

export async function upsertPositions(
  formationId: string,
  positions: DancerPositionInsert[]
): Promise<DancerPosition[]> {
  // Delete all existing positions for this formation
  const { error: deleteError } = await supabase
    .from('dancer_positions')
    .delete()
    .eq('formation_id', formationId);
  if (deleteError) throw new Error(`Failed to clear positions: ${deleteError.message}`);

  // Insert the new batch
  if (positions.length === 0) return [];

  try {
    const { data, error: insertError } = await supabase
      .from('dancer_positions')
      .insert(positions)
      .select();
    if (insertError) {
      toast.error(`Positions were cleared but failed to save new ones: ${insertError.message}. Try saving again.`);
      throw new Error(`Failed to save positions after delete: ${insertError.message}`);
    }
    return data;
  } catch (err) {
    // Re-throw if already our error, otherwise wrap
    if (err instanceof Error && err.message.startsWith('Failed to save positions after delete:')) throw err;
    const msg = err instanceof Error ? err.message : 'Unknown error';
    toast.error(`Positions were cleared but failed to save new ones: ${msg}. Try saving again.`);
    throw new Error(`Failed to save positions after delete: ${msg}`);
  }
}

export async function updatePosition(
  id: string,
  updates: DancerPositionUpdate
): Promise<DancerPosition> {
  const { data, error } = await supabase
    .from('dancer_positions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(`Failed to update position: ${error.message}`);
  return data;
}
