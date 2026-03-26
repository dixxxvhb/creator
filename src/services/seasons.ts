import { supabase, getCurrentUserId } from '@/lib/supabase';
import type { Season, SeasonInsert, SeasonUpdate, PieceSeason } from '@/types';

export async function fetchSeasons(): Promise<Season[]> {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from('seasons')
    .select('*')
    .eq('user_id', userId)
    .order('year', { ascending: false });
  if (error) throw new Error(`Failed to fetch seasons: ${error.message}`);
  return data;
}

export async function createSeason(season: SeasonInsert): Promise<Season> {
  const user_id = await getCurrentUserId();
  const { data, error } = await supabase
    .from('seasons')
    .insert({ ...season, user_id })
    .select()
    .single();
  if (error) throw new Error(`Failed to create season: ${error.message}`);
  return data;
}

export async function updateSeason(id: string, updates: SeasonUpdate): Promise<Season> {
  const { data, error } = await supabase
    .from('seasons')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(`Failed to update season: ${error.message}`);
  return data;
}

export async function deleteSeason(id: string): Promise<void> {
  const { error } = await supabase.from('seasons').delete().eq('id', id);
  if (error) throw new Error(`Failed to delete season: ${error.message}`);
}

// ─── Piece-Season assignments ───

export async function fetchPieceSeasons(): Promise<PieceSeason[]> {
  const { data, error } = await supabase.from('piece_seasons').select('*');
  if (error) throw new Error(`Failed to fetch piece-season links: ${error.message}`);
  return data;
}

export async function assignPieceToSeason(pieceId: string, seasonId: string): Promise<PieceSeason> {
  const { data, error } = await supabase
    .from('piece_seasons')
    .insert({ piece_id: pieceId, season_id: seasonId })
    .select()
    .single();
  if (error) throw new Error(`Failed to assign piece to season: ${error.message}`);
  return data;
}

export async function removePieceFromSeason(pieceId: string, seasonId: string): Promise<void> {
  const { error } = await supabase
    .from('piece_seasons')
    .delete()
    .eq('piece_id', pieceId)
    .eq('season_id', seasonId);
  if (error) throw new Error(`Failed to remove piece from season: ${error.message}`);
}
