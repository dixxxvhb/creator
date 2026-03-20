import { supabase } from '@/lib/supabase';

const BUCKET = 'audio';
const MAX_SIZE = 50 * 1024 * 1024; // 50MB

export async function uploadAudio(pieceId: string, file: File): Promise<string> {
  if (file.size > MAX_SIZE) {
    throw new Error('Audio file must be under 50MB');
  }

  const ext = file.name.split('.').pop() ?? 'mp3';
  const path = `${pieceId}/audio.${ext}`;

  // Remove existing file first (ignore errors if none exists)
  await supabase.storage.from(BUCKET).remove([path]);

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });

  if (error) throw new Error(`Failed to upload audio: ${error.message}`);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function deleteAudio(audioUrl: string): Promise<void> {
  // Extract path from public URL
  const urlParts = audioUrl.split(`/storage/v1/object/public/${BUCKET}/`);
  const path = urlParts[1];
  if (!path) return;

  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) throw new Error(`Failed to delete audio: ${error.message}`);
}
