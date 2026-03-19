
-- Downgrade tous les utilisateurs vers le tier 'calmini' (Trial) pour activer les quotas réels
-- Phase 6 : Nettoyage post-beta illimitée

UPDATE public.user_subscriptions
SET 
  tier = 'calmini',
  status = 'trial',
  is_annual = false,
  -- On garde le nombre d'histoires déjà créées pour que le quota s'applique immédiatement
  updated_at = now();

-- Note : Les futurs utilisateurs seront automatiquement en 'calmini' via la fonction check_user_quota
