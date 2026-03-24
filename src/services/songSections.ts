import { supabase } from '@/lib/supabase';
import type { SongSection, SongSectionInsert, SongSectionUpdate } from '@/types';

export async function fetchSongSections(pieceId: string): Promise<SongSection[]> {
  const { data, error } = await supabase
    .from('song_sections')
    .select('*')
    .eq('piece_id', pieceId)
    .order('sort_order');
  if (error) throw error;
  return data ?? [];
}

export async function createSongSection(section: SongSectionInsert): Promise<SongSection> {
  const { data, error } = await supabase
    .from('song_sections')
    .insert(section)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateSongSection(id: string, updates: SongSectionUpdate): Promise<SongSection> {
  const { data, error } = await supabase
    .from('song_sections')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteSongSection(id: string): Promise<void> {
  const { error } = await supabase
    .from('song_sections')
    .delete()
    .eq('id', id);
  if (error) throw error;
}
