import { supabase, getCurrentUserId } from '@/lib/supabase';
import type {
  Costume, CostumeInsert, CostumeUpdate,
  CostumeAssignment, CostumeAssignmentInsert, CostumeAssignmentUpdate,
} from '@/types';

// ─── Costumes ───

export async function fetchCostumes(): Promise<Costume[]> {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from('costumes')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  if (error) throw new Error(`Failed to fetch costumes: ${error.message}`);
  return data;
}

export async function createCostume(costume: CostumeInsert): Promise<Costume> {
  const user_id = await getCurrentUserId();
  const { data, error } = await supabase
    .from('costumes')
    .insert({ ...costume, user_id })
    .select()
    .single();
  if (error) throw new Error(`Failed to create costume: ${error.message}`);
  return data;
}

export async function updateCostume(id: string, updates: CostumeUpdate): Promise<Costume> {
  const { data, error } = await supabase
    .from('costumes')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(`Failed to update costume: ${error.message}`);
  return data;
}

export async function deleteCostume(id: string): Promise<void> {
  const { error } = await supabase.from('costumes').delete().eq('id', id);
  if (error) throw new Error(`Failed to delete costume: ${error.message}`);
}

// ─── Assignments ───

export async function fetchAssignments(): Promise<CostumeAssignment[]> {
  const { data, error } = await supabase
    .from('costume_assignments')
    .select('*');
  if (error) throw new Error(`Failed to fetch assignments: ${error.message}`);
  return data;
}

export async function createAssignment(assignment: CostumeAssignmentInsert): Promise<CostumeAssignment> {
  const { data, error } = await supabase
    .from('costume_assignments')
    .insert(assignment)
    .select()
    .single();
  if (error) throw new Error(`Failed to create assignment: ${error.message}`);
  return data;
}

export async function updateAssignment(id: string, updates: CostumeAssignmentUpdate): Promise<CostumeAssignment> {
  const { data, error } = await supabase
    .from('costume_assignments')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(`Failed to update assignment: ${error.message}`);
  return data;
}

export async function deleteAssignment(id: string): Promise<void> {
  const { error } = await supabase.from('costume_assignments').delete().eq('id', id);
  if (error) throw new Error(`Failed to delete assignment: ${error.message}`);
}
