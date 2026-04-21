import { supabase } from '@/lib/supabase';
import type { PieceShare, SharedPiecePayload } from '@/types';

const DEFAULT_PUBLIC_APP_URL = 'https://dixxxvhb.github.io/creator/';

function ensureTrailingSlash(url: string): string {
  return url.endsWith('/') ? url : `${url}/`;
}

function getConfiguredPublicAppUrl(): string | null {
  const configured = import.meta.env.VITE_PUBLIC_APP_URL?.trim();
  return configured ? ensureTrailingSlash(configured) : null;
}

function getRuntimePublicAppUrl(): string | null {
  if (typeof window === 'undefined') return null;

  const { origin, protocol, hostname } = window.location;
  const isPublicWebOrigin =
    (protocol === 'http:' || protocol === 'https:') &&
    hostname !== 'localhost' &&
    hostname !== '127.0.0.1';

  if (!isPublicWebOrigin) return null;
  return ensureTrailingSlash(`${origin}${import.meta.env.BASE_URL}`);
}

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

export async function fetchSharedPiecePayload(token: string): Promise<SharedPiecePayload | null> {
  const { data, error } = await supabase.rpc('get_shared_piece_payload', {
    share_token: token,
  });

  if (error) {
    throw new Error(`Failed to fetch shared piece: ${error.message}`);
  }

  return (data as SharedPiecePayload | null) ?? null;
}

export function getShareUrl(token: string): string {
  const baseUrl =
    getConfiguredPublicAppUrl() ??
    getRuntimePublicAppUrl() ??
    DEFAULT_PUBLIC_APP_URL;

  return new URL(`view/${token}`, baseUrl).toString();
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
