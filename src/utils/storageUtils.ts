import { supabase } from '@/integrations/supabase/client';

/**
 * Get a signed URL for a file in a private Supabase storage bucket.
 * If the audio_url is already a full URL (legacy), returns it as-is.
 * If it's a path, generates a signed URL valid for 1 hour.
 */
export async function getSignedAudioUrl(audioPath: string | null): Promise<string | null> {
  if (!audioPath) return null;

  // Legacy: if it's already a full URL, return as-is
  if (audioPath.startsWith('http://') || audioPath.startsWith('https://')) {
    return audioPath;
  }

  const { data, error } = await supabase.storage
    .from('audio-files')
    .createSignedUrl(audioPath, 3600); // 1 hour

  if (error) {
    console.error('[storageUtils] Error creating signed URL for audio:', error);
    return null;
  }

  return data.signedUrl;
}

/**
 * Get a signed URL for a file in the epub-files bucket.
 * If the path is already a full URL (legacy), returns it as-is.
 */
export async function getSignedEpubUrl(filePath: string | null): Promise<string | null> {
  if (!filePath) return null;

  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath;
  }

  const { data, error } = await supabase.storage
    .from('epub-files')
    .createSignedUrl(filePath, 3600);

  if (error) {
    console.error('[storageUtils] Error creating signed URL for epub:', error);
    return null;
  }

  return data.signedUrl;
}
