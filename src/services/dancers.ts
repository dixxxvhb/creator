import { supabase } from '@/lib/supabase';
import type { Dancer, DancerInsert, DancerUpdate } from '@/types';

export async function fetchDancers(): Promise<Dancer[]> {
  const { data, error } = await supabase
    .from('dancers')
    .select('*')
    .eq('is_active', true)
    .order('full_name', { ascending: true });
  if (error) throw new Error(`Failed to fetch dancers: ${error.message}`);
  return data;
}

export async function createDancer(dancer: DancerInsert): Promise<Dancer> {
  const { data, error } = await supabase
    .from('dancers')
    .insert(dancer)
    .select()
    .single();
  if (error) throw new Error(`Failed to create dancer: ${error.message}`);
  return data;
}

export async function updateDancer(id: string, updates: DancerUpdate): Promise<Dancer> {
  const { data, error } = await supabase
    .from('dancers')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(`Failed to update dancer: ${error.message}`);
  return data;
}

export async function fetchDancerPieceAssignments(): Promise<Record<string, { id: string; title: string }[]>> {
  const { data, error } = await supabase
    .from('dancer_positions')
    .select('dancer_id, formations!inner(piece_id, pieces!inner(id, title))')
    .not('dancer_id', 'is', null);
  if (error) throw new Error(`Failed to fetch dancer assignments: ${error.message}`);

  const map: Record<string, { id: string; title: string }[]> = {};
  for (const row of data ?? []) {
    const dancerId = row.dancer_id as string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const piece = (row as any).formations?.pieces;
    if (!dancerId || !piece) continue;
    if (!map[dancerId]) map[dancerId] = [];
    if (!map[dancerId].some((p) => p.id === piece.id)) {
      map[dancerId].push({ id: piece.id, title: piece.title });
    }
  }
  return map;
}

export async function deleteDancer(id: string): Promise<Dancer> {
  const { data, error } = await supabase
    .from('dancers')
    .update({ is_active: false })
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(`Failed to delete dancer: ${error.message}`);
  return data;
}
