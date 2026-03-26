import { supabase } from '@/lib/supabase';
import type { PieceShare } from '@/types';

export async function createShare(
  pieceId: string,
  expiresAt?: string
): Promise<PieceShare | null> {
  const insert: Record<string, unknown> = { piece_id: pieceId };
  if (expiresAt) insert.expires_at = expiresAt;

  const { data, error } = await supabase
    .from('piece_shares')
    .insert(insert)
    .select()
    .single();
  if (error) throw new Error(`Failed to create share: ${error.message}`);
  return data;
}

export async function getShareByToken(token: string): Promise<PieceShare | null> {
  const { data, error } = await supabase
    .from('piece_shares')
    .select('*')
    .eq('token', token)
    .single();
  if (error) {
    if (error.code === 'PGRST116') return null; // not found
    throw new Error(`Failed to fetch share: ${error.message}`);
  }
  return data;
}

export async function listShares(pieceId: string): Promise<PieceShare[]> {
  const { data, error } = await supabase
    .from('piece_shares')
    .select('*')
    .eq('piece_id', pieceId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(`Failed to list shares: ${error.message}`);
  return data;
}

export async function revokeShare(id: string): Promise<void> {
  const { error } = await supabase
    .from('piece_shares')
    .delete()
    .eq('id', id);
  if (error) throw new Error(`Failed to revoke share: ${error.message}`);
}
