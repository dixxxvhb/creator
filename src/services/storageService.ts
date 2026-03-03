import { supabase } from '@/config/supabase'

export async function uploadAudio(
  pieceId: string,
  file: File,
): Promise<string> {
  const path = `${pieceId}/${file.name}`

  const { error } = await supabase.storage
    .from('audio-files')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: true,
    })

  if (error) throw error
  return path
}

export async function getAudioUrl(storagePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from('audio-files')
    .createSignedUrl(storagePath, 3600) // 1 hour

  if (error) throw error
  return data.signedUrl
}
