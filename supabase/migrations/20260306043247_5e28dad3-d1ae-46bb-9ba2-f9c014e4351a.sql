-- Make audio-files and epub-files buckets private
UPDATE storage.buckets SET public = false WHERE id IN ('audio-files', 'epub-files');

-- Drop public read policies for audio-files
DROP POLICY IF EXISTS "Allow public read access to audio files" ON storage.objects;

-- Drop public read policies for epub-files  
DROP POLICY IF EXISTS "Public read access for epub files" ON storage.objects;

-- Ensure authenticated users can read their own audio files (via story ownership)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users read own audio files' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Authenticated users read own audio files"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
      bucket_id = 'audio-files' 
      AND (storage.foldername(name))[1] IN (
        SELECT id::text FROM public.stories WHERE authorid = auth.uid()
      )
    );
  END IF;
END $$;

-- Ensure authenticated users can read their own epub files
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users read own epub files' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Authenticated users read own epub files"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
      bucket_id = 'epub-files'
      AND (storage.foldername(name))[1] = auth.uid()::text
    );
  END IF;
END $$;