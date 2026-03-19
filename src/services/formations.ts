import { supabase } from '@/lib/supabase';
import type { Formation, FormationInsert, FormationUpdate } from '@/types';

export async function fetchFormations(pieceId: string): Promise<Formation[]> {
  const { data, error } = await supabase
    .from('formations')
    .select('*')
    .eq('piece_id', pieceId)
    .order('index', { ascending: true });
  if (error) throw new Error(`Failed to fetch formations: ${error.message}`);
  return data;
}

export async function createFormation(formation: FormationInsert): Promise<Formation> {
  const { data, error } = await supabase
    .from('formations')
    .insert(formation)
    .select()
    .single();
  if (error) throw new Error(`Failed to create formation: ${error.message}`);
  return data;
}

export async function updateFormation(id: string, updates: FormationUpdate): Promise<Formation> {
  const { data, error } = await supabase
    .from('formations')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(`Failed to update formation: ${error.message}`);
  return data;
}

export async function deleteFormation(id: string): Promise<void> {
  const { error } = await supabase
    .from('formations')
    .delete()
    .eq('id', id);
  if (error) throw new Error(`Failed to delete formation: ${error.message}`);
}

export async function reorderFormations(pieceId: string, orderedIds: string[]): Promise<void> {
  const updates = orderedIds.map((id, index) =>
    supabase
      .from('formations')
      .update({ index })
      .eq('id', id)
      .eq('piece_id', pieceId)
  );
  const results = await Promise.all(updates);
  const failed = results.find((r) => r.error);
  if (failed?.error) throw new Error(`Failed to reorder formations: ${failed.error.message}`);
}
