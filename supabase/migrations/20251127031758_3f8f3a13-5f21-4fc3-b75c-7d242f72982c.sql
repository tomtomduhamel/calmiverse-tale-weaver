-- Rendre le bucket epub-files public pour permettre l'accès aux fichiers EPUB
UPDATE storage.buckets 
SET public = true 
WHERE id = 'epub-files';

-- Créer une politique RLS pour permettre la lecture publique des fichiers EPUB
CREATE POLICY "Public read access for epub files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'epub-files');