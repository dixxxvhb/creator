import { supabase } from '@/lib/supabase';
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
  // Safe order: insert new first, then delete old — prevents data loss if network drops mid-operation
  // 1. Get IDs of existing positions so we can delete them after insert
  const { data: existing, error: fetchError } = await supabase
    .from('dancer_positions')
    .select('id')
    .eq('formation_id', formationId);
  if (fetchError) throw new Error(`Failed to fetch existing positions: ${fetchError.message}`);

  const oldIds = (existing ?? []).map((p) => p.id);

  // 2. Insert new positions (fresh UUIDs from Supabase)
  let inserted: DancerPosition[] = [];
  if (positions.length > 0) {
    const { data, error: insertError } = await supabase
      .from('dancer_positions')
      .insert(positions)
      .select();
    if (insertError) throw new Error(`Failed to save positions: ${insertError.message}`);
    inserted = data;
  }

  // 3. Delete old positions by ID (if insert succeeded, safe to remove)
  if (oldIds.length > 0) {
    const { error: deleteError } = await supabase
      .from('dancer_positions')
      .delete()
      .in('id', oldIds);
    if (deleteError) {
      // Non-fatal: duplicates exist but no data was lost
      console.warn('Failed to clean up old positions (duplicates may exist):', deleteError.message);
    }
  }

  return inserted;
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
