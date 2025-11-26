-- Rendre le bucket audio-files public pour permettre la lecture des fichiers audio
UPDATE storage.buckets 
SET public = true 
WHERE name = 'audio-files';

-- Supprimer la politique existante si elle existe
DROP POLICY IF EXISTS "Allow public read access to audio files" ON storage.objects;

-- Créer une politique RLS pour permettre la lecture publique des fichiers audio
CREATE POLICY "Allow public read access to audio files"
ON storage.objects FOR SELECT
USING (bucket_id = 'audio-files');