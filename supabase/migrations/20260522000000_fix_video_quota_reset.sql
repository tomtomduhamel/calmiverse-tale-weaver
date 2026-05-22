-- Le reset mensuel des quotas oubliait video_intros_used_this_period, donc ce
-- compteur ne revenait jamais à zéro et finissait par bloquer la génération de
-- nouvelles vidéos pour tous les utilisateurs.
CREATE OR REPLACE FUNCTION public.reset_monthly_quotas()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Reset les quotas pour les abonnements dont la période est expirée
  UPDATE public.user_subscriptions
  SET stories_used_this_period = 0,
      audio_generations_used_this_period = 0,
      video_intros_used_this_period = 0,
      current_period_start = current_period_end,
      current_period_end = CASE
        WHEN is_annual THEN current_period_end + interval '1 year'
        ELSE current_period_end + interval '1 month'
      END,
      updated_at = now()
  WHERE current_period_end <= now()
    AND status = 'active';

  -- Expirer les trials
  UPDATE public.user_subscriptions
  SET status = 'expired',
      updated_at = now()
  WHERE current_period_end <= now()
    AND status = 'trial';
END;
$$;
