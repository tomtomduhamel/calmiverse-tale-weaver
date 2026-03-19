
-- 1. Corriger les limites du tier 'calmini' pour permettre au moins 1 enfant
UPDATE public.subscription_limits
SET 
  max_children = 1,
  stories_per_month = 5, -- On baisse à 5 pour être plus restrictif en beta
  audio_generations_per_month = 2,
  updated_at = now()
WHERE tier = 'calmini';

-- 2. Downgrade tous les utilisateurs existants vers le tier 'calmini' (Trial) 
-- pour que les quotas s'appliquent à tout le monde (Early Adopters inclus)
UPDATE public.user_subscriptions
SET 
  tier = 'calmini',
  status = 'trial',
  is_annual = false,
  updated_at = now();

-- 3. S'assurer que les futurs utilisateurs sont aussi en Calmini
-- (Déjà géré par la fonction RPC check_user_quota)
