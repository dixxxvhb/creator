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
