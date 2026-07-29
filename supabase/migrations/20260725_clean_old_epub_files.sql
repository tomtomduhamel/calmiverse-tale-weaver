-- Migration SQL: Purge automatique des fichiers EPUB temporaires de plus de 30 jours
-- Projet: Calmi (ioeihnoxvtpxtqhxklpw)

CREATE OR REPLACE FUNCTION public.clean_old_epub_files(p_days_to_keep INTEGER DEFAULT 30)
RETURNS TABLE (
    bucket_id TEXT,
    deleted_files BIGINT,
    freed_space_mb NUMERIC,
    status TEXT
) AS $$
DECLARE
    v_count BIGINT := 0;
    v_bytes BIGINT := 0;
BEGIN
    SELECT COUNT(*), COALESCE(SUM((metadata->>'size')::bigint), 0)
    INTO v_count, v_bytes
    FROM storage.objects
    WHERE storage.objects.bucket_id = 'epub-files'
      AND created_at < (NOW() - (p_days_to_keep || ' days')::INTERVAL);

    IF v_count > 0 THEN
        PERFORM set_config('storage.allow_delete_query', 'true', true);

        DELETE FROM storage.objects
        WHERE storage.objects.bucket_id = 'epub-files'
          AND created_at < (NOW() - (p_days_to_keep || ' days')::INTERVAL);
    END IF;

    bucket_id := 'epub-files';
    deleted_files := v_count;
    freed_space_mb := ROUND((v_bytes / (1024.0 * 1024.0))::numeric, 2);
    status := 'PURGÉ';
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Planification mensuelle avec pg_cron (le 1er du mois à 03h45 UTC)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'monthly_epub_files_cleanup') THEN
        PERFORM cron.unschedule('monthly_epub_files_cleanup');
    END IF;
    PERFORM cron.schedule(
        'monthly_epub_files_cleanup',
        '45 3 1 * *',
        'SELECT public.clean_old_epub_files(30);'
    );
END $$;
