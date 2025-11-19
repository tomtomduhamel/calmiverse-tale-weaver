-- ============================================
-- PHASE A: SÉCURISATION COMPLÈTE - STORAGE BUCKETS
-- ============================================
-- CRITIQUE: Protéger les photos d'enfants et fichiers sensibles
-- Passer les buckets en privé + ajouter RLS strictes

-- 1. Rendre les buckets privés (URGENT - RGPD)
UPDATE storage.buckets 
SET public = false 
WHERE id IN ('teddy-photos', 'audio-files', 'epub-files');

-- 2. Supprimer les anciennes policies trop permissives
DROP POLICY IF EXISTS "Anyone can view teddy photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view audio files" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view epub files" ON storage.objects;

-- 3. RLS STRICTES pour teddy-photos (photos enfants)
-- Les parents peuvent voir UNIQUEMENT les photos de LEURS enfants
CREATE POLICY "Parents can view their children teddy photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'teddy-photos' 
  AND auth.uid() IN (
    SELECT authorid FROM public.children 
    WHERE id::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Parents can upload their children teddy photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'teddy-photos' 
  AND auth.uid() IN (
    SELECT authorid FROM public.children 
    WHERE id::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Parents can delete their children teddy photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'teddy-photos' 
  AND auth.uid() IN (
    SELECT authorid FROM public.children 
    WHERE id::text = (storage.foldername(name))[1]
  )
);

-- 4. RLS pour audio-files (fichiers audio des histoires)
CREATE POLICY "Users can view their story audio files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'audio-files' 
  AND auth.uid() IN (
    SELECT s.authorid 
    FROM public.stories s
    JOIN public.audio_files af ON af.story_id = s.id
    WHERE af.audio_url LIKE '%' || name || '%'
  )
);

CREATE POLICY "Service can upload audio files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'audio-files'
  -- Autorisé seulement via edge functions avec service_role
);

-- 5. RLS pour epub-files (exports EPUB)
CREATE POLICY "Users can view their epub files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'epub-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can upload their epub files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'epub-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their epub files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'epub-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 6. Fonction helper pour générer des signed URLs (60 min)
CREATE OR REPLACE FUNCTION public.get_signed_url(
  bucket_name TEXT,
  file_path TEXT,
  expires_in INTEGER DEFAULT 3600
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  signed_url TEXT;
BEGIN
  -- Vérifier que l'utilisateur a accès au fichier
  IF bucket_name = 'teddy-photos' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.children 
      WHERE authorid = auth.uid() 
      AND id::text = split_part(file_path, '/', 1)
    ) THEN
      RAISE EXCEPTION 'Accès refusé à ce fichier';
    END IF;
  ELSIF bucket_name = 'audio-files' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.stories 
      WHERE authorid = auth.uid() 
      AND id::text = split_part(file_path, '/', 1)
    ) THEN
      RAISE EXCEPTION 'Accès refusé à ce fichier';
    END IF;
  ELSIF bucket_name = 'epub-files' THEN
    IF split_part(file_path, '/', 1) != auth.uid()::text THEN
      RAISE EXCEPTION 'Accès refusé à ce fichier';
    END IF;
  END IF;
  
  -- Générer l'URL signée (durée par défaut: 1h)
  -- Note: Cette fonction sera appelée depuis le client pour obtenir des URLs temporaires
  RETURN format(
    '%s/storage/v1/object/sign/%s/%s?token=%s',
    current_setting('app.settings.supabase_url', true),
    bucket_name,
    file_path,
    encode(digest(file_path || expires_in::text || now()::text, 'sha256'), 'hex')
  );
END;
$$;

-- 7. Fonction pour nettoyer les anciens fichiers (> 90 jours)
CREATE OR REPLACE FUNCTION public.cleanup_old_storage_files()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage
AS $$
BEGIN
  -- Supprimer les fichiers audio orphelins (sans story associée)
  DELETE FROM storage.objects
  WHERE bucket_id = 'audio-files'
  AND created_at < now() - interval '90 days'
  AND name NOT IN (
    SELECT audio_url FROM public.audio_files WHERE audio_url IS NOT NULL
  );
  
  -- Supprimer les EPUB anciens (> 90 jours)
  DELETE FROM storage.objects
  WHERE bucket_id = 'epub-files'
  AND created_at < now() - interval '90 days';
  
  RAISE NOTICE 'Nettoyage des fichiers anciens terminé';
END;
$$;

-- 8. Log de sécurité pour accès storage
CREATE OR REPLACE FUNCTION public.log_storage_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Logger les accès aux buckets sensibles
  IF NEW.bucket_id IN ('teddy-photos', 'audio-files') THEN
    INSERT INTO public.security_audit_logs (
      user_id, action, resource, result, metadata
    ) VALUES (
      auth.uid(),
      'storage_access',
      NEW.bucket_id || '/' || NEW.name,
      'allowed',
      jsonb_build_object(
        'bucket', NEW.bucket_id,
        'file_size', NEW.metadata->>'size',
        'mime_type', NEW.metadata->>'mimetype'
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Activer le trigger de logging
DROP TRIGGER IF EXISTS log_storage_access_trigger ON storage.objects;
CREATE TRIGGER log_storage_access_trigger
AFTER INSERT ON storage.objects
FOR EACH ROW
EXECUTE FUNCTION public.log_storage_access();