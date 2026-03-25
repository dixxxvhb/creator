import { supabase } from '@/lib/supabase';
import type { Show, ShowInsert, ShowUpdate, ShowAct, ShowActInsert, ShowActUpdate } from '@/types';

// ─── Shows ───

export async function fetchAllShows(): Promise<Show[]> {
  const { data, error } = await supabase
    .from('shows')
    .select('*')
    .order('date', { ascending: true });
  if (error) throw new Error(`Failed to fetch shows: ${error.message}`);
  return data;
}

export async function fetchShows(seasonId: string): Promise<Show[]> {
  const { data, error } = await supabase
    .from('shows')
    .select('*')
    .eq('season_id', seasonId)
    .order('date', { ascending: true });
  if (error) throw new Error(`Failed to fetch shows: ${error.message}`);
  return data;
}

export async function createShow(show: ShowInsert): Promise<Show> {
  const { data, error } = await supabase
    .from('shows')
    .insert(show)
    .select()
    .single();
  if (error) throw new Error(`Failed to create show: ${error.message}`);
  return data;
}

export async function updateShow(id: string, updates: ShowUpdate): Promise<Show> {
  const { data, error } = await supabase
    .from('shows')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(`Failed to update show: ${error.message}`);
  return data;
}

export async function deleteShow(id: string): Promise<void> {
  const { error } = await supabase.from('shows').delete().eq('id', id);
  if (error) throw new Error(`Failed to delete show: ${error.message}`);
}

// ─── Show Acts ───

export async function fetchShowActs(showId: string): Promise<ShowAct[]> {
  const { data, error } = await supabase
    .from('show_acts')
    .select('*')
    .eq('show_id', showId)
    .order('act_number', { ascending: true });
  if (error) throw new Error(`Failed to fetch show acts: ${error.message}`);
  return data;
}

export async function createShowAct(act: ShowActInsert): Promise<ShowAct> {
  const { data, error } = await supabase
    .from('show_acts')
    .insert(act)
    .select()
    .single();
  if (error) throw new Error(`Failed to create show act: ${error.message}`);
  return data;
}

export async function updateShowAct(id: string, updates: ShowActUpdate): Promise<ShowAct> {
  const { data, error } = await supabase
    .from('show_acts')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(`Failed to update show act: ${error.message}`);
  return data;
}

export async function deleteShowAct(id: string): Promise<void> {
  const { error } = await supabase.from('show_acts').delete().eq('id', id);
  if (error) throw new Error(`Failed to delete show act: ${error.message}`);
}

export async function reorderShowActs(_showId: string, orderedActIds: string[]): Promise<void> {
  const updates = orderedActIds.map((id, idx) =>
    supabase.from('show_acts').update({ act_number: idx }).eq('id', id)
  );
  const results = await Promise.all(updates);
  const failed = results.find((r) => r.error);
  if (failed?.error) throw new Error(`Failed to reorder acts: ${failed.error.message}`);
}
