import { supabase } from '@/lib/supabase';
import type { Prop, PropInsert, PropUpdate } from '@/types';

export async function fetchProps(): Promise<Prop[]> {
  const { data, error } = await supabase
    .from('props')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw new Error(`Failed to fetch props: ${error.message}`);
  return data;
}

export async function createProp(prop: PropInsert): Promise<Prop> {
  const { data, error } = await supabase
    .from('props')
    .insert(prop)
    .select()
    .single();
  if (error) throw new Error(`Failed to create prop: ${error.message}`);
  return data;
}

export async function updateProp(id: string, updates: PropUpdate): Promise<Prop> {
  const { data, error } = await supabase
    .from('props')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(`Failed to update prop: ${error.message}`);
  return data;
}

export async function deleteProp(id: string): Promise<void> {
  const { error } = await supabase.from('props').delete().eq('id', id);
  if (error) throw new Error(`Failed to delete prop: ${error.message}`);
}
