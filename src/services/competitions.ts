import { supabase, getCurrentUserId } from '@/lib/supabase';
import type {
  Competition, CompetitionInsert, CompetitionUpdate,
  CompetitionEntry, CompetitionEntryInsert, CompetitionEntryUpdate,
} from '@/types';

// ─── Competitions ───

export async function fetchAllCompetitions(): Promise<Competition[]> {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from('competitions')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: true });
  if (error) throw new Error(`Failed to fetch competitions: ${error.message}`);
  return data;
}

export async function fetchCompetitions(seasonId: string): Promise<Competition[]> {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from('competitions')
    .select('*')
    .eq('user_id', userId)
    .eq('season_id', seasonId)
    .order('date', { ascending: true });
  if (error) throw new Error(`Failed to fetch competitions: ${error.message}`);
  return data;
}

export async function createCompetition(comp: CompetitionInsert): Promise<Competition> {
  const user_id = await getCurrentUserId();
  const { data, error } = await supabase
    .from('competitions')
    .insert({ ...comp, user_id })
    .select()
    .single();
  if (error) throw new Error(`Failed to create competition: ${error.message}`);
  return data;
}

export async function updateCompetition(id: string, updates: CompetitionUpdate): Promise<Competition> {
  const { data, error } = await supabase
    .from('competitions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(`Failed to update competition: ${error.message}`);
  return data;
}

export async function deleteCompetition(id: string): Promise<void> {
  const { error } = await supabase.from('competitions').delete().eq('id', id);
  if (error) throw new Error(`Failed to delete competition: ${error.message}`);
}

// ─── Competition Entries ───

export async function fetchEntries(competitionId: string): Promise<CompetitionEntry[]> {
  const { data, error } = await supabase
    .from('competition_entries')
    .select('*')
    .eq('competition_id', competitionId)
    .order('created_at', { ascending: true });
  if (error) throw new Error(`Failed to fetch entries: ${error.message}`);
  return data;
}

export async function fetchEntriesBySeason(seasonId: string): Promise<CompetitionEntry[]> {
  // Get all competition IDs for this season, then fetch their entries
  const { data: comps, error: compErr } = await supabase
    .from('competitions')
    .select('id')
    .eq('season_id', seasonId);
  if (compErr) throw new Error(`Failed to fetch competitions: ${compErr.message}`);
  if (!comps.length) return [];

  const compIds = comps.map((c) => c.id);
  const { data, error } = await supabase
    .from('competition_entries')
    .select('*')
    .in('competition_id', compIds);
  if (error) throw new Error(`Failed to fetch entries: ${error.message}`);
  return data;
}

export async function createEntry(entry: CompetitionEntryInsert): Promise<CompetitionEntry> {
  const { data, error } = await supabase
    .from('competition_entries')
    .insert(entry)
    .select()
    .single();
  if (error) throw new Error(`Failed to create entry: ${error.message}`);
  return data;
}

export async function updateEntry(id: string, updates: CompetitionEntryUpdate): Promise<CompetitionEntry> {
  const { data, error } = await supabase
    .from('competition_entries')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(`Failed to update entry: ${error.message}`);
  return data;
}

export async function deleteEntry(id: string): Promise<void> {
  const { error } = await supabase.from('competition_entries').delete().eq('id', id);
  if (error) throw new Error(`Failed to delete entry: ${error.message}`);
}
