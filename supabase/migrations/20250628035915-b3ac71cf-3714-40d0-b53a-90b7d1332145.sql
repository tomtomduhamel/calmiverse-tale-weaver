
-- Créer le bucket audio-files dans Supabase Storage
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'audio-files',
  'audio-files', 
  true,
  52428800, -- 50MB limit
  ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/m4a']
);

-- Créer une politique pour permettre l'insertion de fichiers audio
CREATE POLICY "Allow authenticated users to upload audio files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'audio-files');

-- Créer une politique pour permettre la lecture publique des fichiers audio
CREATE POLICY "Allow public access to audio files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'audio-files');

-- Créer une politique pour permettre la mise à jour des fichiers audio
CREATE POLICY "Allow authenticated users to update audio files" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'audio-files');

-- Créer une politique pour permettre la suppression des fichiers audio
CREATE POLICY "Allow authenticated users to delete audio files" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'audio-files');
