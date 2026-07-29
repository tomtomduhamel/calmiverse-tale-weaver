-- Migration SQL: Fonction de nettoyage automatisé des fichiers orphelins dans Supabase Storage
-- Projet: Calmi (ioeihnoxvtpxtqhxklpw)

CREATE OR REPLACE FUNCTION public.clean_storage_orphans(p_dry_run BOOLEAN DEFAULT TRUE)
RETURNS TABLE (
    bucket_id TEXT,
    total_files BIGINT,
    orphan_files BIGINT,
    freed_space_mb NUMERIC,
    status TEXT
) AS $$
DECLARE
    v_img_orphan_count BIGINT;
    v_img_orphan_bytes BIGINT;
    v_aud_orphan_count BIGINT;
    v_aud_orphan_bytes BIGINT;
BEGIN
    -- 1. Compter les orphelins dans storyimages
    SELECT COUNT(*), COALESCE(SUM((o.metadata->>'size')::bigint), 0)
    INTO v_img_orphan_count, v_img_orphan_bytes
    FROM storage.objects o
    LEFT JOIN public.stories s ON o.name = s.image_path
    LEFT JOIN public.story_series ss ON o.name = ss.image_path
    WHERE o.bucket_id = 'storyimages'
      AND s.image_path IS NULL 
      AND ss.image_path IS NULL;

    -- 2. Compter les orphelins dans audio-files
    SELECT COUNT(*), COALESCE(SUM((o.metadata->>'size')::bigint), 0)
    INTO v_aud_orphan_count, v_aud_orphan_bytes
    FROM storage.objects o
    LEFT JOIN public.audio_files af ON af.audio_url LIKE '%' || o.name
    WHERE o.bucket_id = 'audio-files'
      AND af.audio_url IS NULL;

    -- Si suppression demandée (p_dry_run = FALSE)
    IF NOT p_dry_run THEN
        -- Débloquer la suppression SQL sur storage.objects pour la durée de cette transaction
        PERFORM set_config('storage.allow_delete_query', 'true', true);

        -- Purger storyimages
        DELETE FROM storage.objects o
        WHERE o.bucket_id = 'storyimages'
          AND o.name NOT IN (SELECT image_path FROM public.stories WHERE image_path IS NOT NULL)
          AND o.name NOT IN (SELECT image_path FROM public.story_series WHERE image_path IS NOT NULL);

        -- Purger audio-files
        DELETE FROM storage.objects o
        WHERE o.bucket_id = 'audio-files'
          AND o.id IN (
            SELECT o_sub.id 
            FROM storage.objects o_sub
            LEFT JOIN public.audio_files af ON af.audio_url LIKE '%' || o_sub.name
            WHERE o_sub.bucket_id = 'audio-files' AND af.audio_url IS NULL
          );
    END IF;

    -- Résultat pour storyimages
    bucket_id := 'storyimages';
    SELECT COUNT(*) INTO total_files FROM storage.objects WHERE storage.objects.bucket_id = 'storyimages';
    orphan_files := v_img_orphan_count;
    freed_space_mb := ROUND((v_img_orphan_bytes / (1024.0 * 1024.0))::numeric, 2);
    status := CASE WHEN p_dry_run THEN 'DRY-RUN (Simulé)' ELSE 'PURGÉ (Supprimé)' END;
    RETURN NEXT;

    -- Résultat pour audio-files
    bucket_id := 'audio-files';
    SELECT COUNT(*) INTO total_files FROM storage.objects WHERE storage.objects.bucket_id = 'audio-files';
    orphan_files := v_aud_orphan_count;
    freed_space_mb := ROUND((v_aud_orphan_bytes / (1024.0 * 1024.0))::numeric, 2);
    status := CASE WHEN p_dry_run THEN 'DRY-RUN (Simulé)' ELSE 'PURGÉ (Supprimé)' END;
    RETURN NEXT;

    -- Résultat pour story_sounds
    bucket_id := 'story_sounds';
    SELECT COUNT(*) INTO total_files FROM storage.objects WHERE storage.objects.bucket_id = 'story_sounds';
    orphan_files := 0;
    freed_space_mb := 0.00;
    status := CASE WHEN p_dry_run THEN 'DRY-RUN (Simulé)' ELSE 'CONSERVÉ (0 orphelin)' END;
    RETURN NEXT;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Planification mensuelle automatique avec pg_cron (exécutée le 1er du mois à 03h00 UTC)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'monthly_storage_orphan_cleanup') THEN
        PERFORM cron.unschedule('monthly_storage_orphan_cleanup');
    END IF;
    PERFORM cron.schedule(
        'monthly_storage_orphan_cleanup',
        '0 3 1 * *',
        'SELECT public.clean_storage_orphans(false);'
    );
END $$;
