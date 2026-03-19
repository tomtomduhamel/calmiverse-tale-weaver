
-- 1. Corriger les limites de TOUS les tiers pour qu'elles soient cohérentes
-- Calmini : 1 enfant, 10 histoires
-- Calmidium : 2 enfants, 30 histoires
-- Calmix : 3 enfants, 50 histoires
-- Calmixxl : Illimité (NULL)

UPDATE public.subscription_limits SET max_children = 1, stories_per_month = 10 WHERE tier = 'calmini';
UPDATE public.subscription_limits SET max_children = 2, stories_per_month = 30 WHERE tier = 'calmidium';
UPDATE public.subscription_limits SET max_children = 3, stories_per_month = 50 WHERE tier = 'calmix';
UPDATE public.subscription_limits SET max_children = NULL, stories_per_month = 100 WHERE tier = 'calmixxl';

-- 2. Restaurer les early adopters au tier 'calmix' (Premium) comme demandé
UPDATE public.user_subscriptions
SET 
  tier = 'calmix',
  status = 'active',
  updated_at = now();

-- Les quotas sont maintenant ACTIVÉS (vérifiés) mais les limites sont celles du pack Calmix.
