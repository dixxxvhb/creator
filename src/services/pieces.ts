import { supabase } from '@/lib/supabase';
import type { Piece, PieceInsert, PieceUpdate } from '@/types';

export async function fetchPieces(): Promise<Piece[]> {
  const { data, error } = await supabase
    .from('pieces')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) throw new Error(`Failed to fetch pieces: ${error.message}`);
  return data;
}

export async function fetchPiece(id: string): Promise<Piece> {
  const { data, error } = await supabase
    .from('pieces')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw new Error(`Failed to fetch piece: ${error.message}`);
  return data;
}

export async function createPiece(piece: PieceInsert): Promise<Piece> {
  const { data, error } = await supabase
    .from('pieces')
    .insert(piece)
    .select()
    .single();
  if (error) throw new Error(`Failed to create piece: ${error.message}`);
  return data;
}

export async function updatePiece(id: string, updates: PieceUpdate): Promise<Piece> {
  const { data, error } = await supabase
    .from('pieces')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(`Failed to update piece: ${error.message}`);
  return data;
}

export async function deletePiece(id: string): Promise<void> {
  const { error } = await supabase
    .from('pieces')
    .delete()
    .eq('id', id);
  if (error) throw new Error(`Failed to delete piece: ${error.message}`);
}
