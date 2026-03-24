import { supabase } from '@/lib/supabase';
import type { CostumeAccessory, CostumeAccessoryInsert } from '@/types';

export async function fetchAccessories(costumeId?: string): Promise<CostumeAccessory[]> {
  let query = supabase
    .from('costume_accessories')
    .select('*')
    .order('created_at', { ascending: true });

  if (costumeId) {
    query = query.eq('costume_id', costumeId);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to fetch accessories: ${error.message}`);
  return data;
}

export async function createAccessory(data: CostumeAccessoryInsert): Promise<CostumeAccessory> {
  const { data: created, error } = await supabase
    .from('costume_accessories')
    .insert(data)
    .select()
    .single();
  if (error) throw new Error(`Failed to create accessory: ${error.message}`);
  return created;
}

export async function deleteAccessory(id: string): Promise<void> {
  const { error } = await supabase.from('costume_accessories').delete().eq('id', id);
  if (error) throw new Error(`Failed to delete accessory: ${error.message}`);
}
