-- Migration SQL: Nettoyage et purge automatique des logs Postgres Supabase
-- Projet: Calmi (ioeihnoxvtpxtqhxklpw)

CREATE OR REPLACE FUNCTION public.clean_old_auth_logs(p_days_to_keep INTEGER DEFAULT 30)
RETURNS TABLE (
    deleted_audit_logs BIGINT,
    deleted_refresh_tokens BIGINT,
    deleted_cron_history BIGINT,
    status TEXT
) AS $$
DECLARE
    v_audit_count BIGINT := 0;
    v_token_count BIGINT := 0;
    v_cron_count BIGINT := 0;
BEGIN
    -- 1. Purge auth.audit_log_entries (+30 jours)
    WITH deleted AS (
        DELETE FROM auth.audit_log_entries
        WHERE created_at < (NOW() - (p_days_to_keep || ' days')::INTERVAL)
        RETURNING *
    )
    SELECT COUNT(*) INTO v_audit_count FROM deleted;

    -- 2. Purge auth.refresh_tokens expirés (+30 jours)
    WITH deleted AS (
        DELETE FROM auth.refresh_tokens
        WHERE (revoked = true OR updated_at < (NOW() - (p_days_to_keep || ' days')::INTERVAL))
        RETURNING *
    )
    SELECT COUNT(*) INTO v_token_count FROM deleted;

    -- 3. Purge cron.job_run_details (+14 jours)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'cron' AND table_name = 'job_run_details') THEN
        WITH deleted AS (
            DELETE FROM cron.job_run_details
            WHERE end_time < (NOW() - INTERVAL '14 days')
            RETURNING *
        )
        SELECT COUNT(*) INTO v_cron_count FROM deleted;
    END IF;

    deleted_audit_logs := v_audit_count;
    deleted_refresh_tokens := v_token_count;
    deleted_cron_history := v_cron_count;
    status := 'PURGÉ';
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Planification mensuelle automatique avec pg_cron (le 1er du mois à 03h30 UTC)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'monthly_auth_logs_cleanup') THEN
        PERFORM cron.unschedule('monthly_auth_logs_cleanup');
    END IF;
    PERFORM cron.schedule(
        'monthly_auth_logs_cleanup',
        '30 3 1 * *',
        'SELECT public.clean_old_auth_logs(30);'
    );
END $$;
