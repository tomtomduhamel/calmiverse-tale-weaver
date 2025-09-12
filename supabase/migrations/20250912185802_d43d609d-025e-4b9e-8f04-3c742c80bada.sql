-- Phase 1: Création du système d'abonnements Calmiverse

-- 1. Créer l'enum pour les tiers d'abonnement
CREATE TYPE public.subscription_tier AS ENUM ('calmini', 'calmidium', 'calmix', 'calmixxl');

-- 2. Table des abonnements utilisateurs
CREATE TABLE public.user_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  tier subscription_tier NOT NULL DEFAULT 'calmini',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled', 'trial')),
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '1 month'),
  stories_used_this_period INTEGER NOT NULL DEFAULT 0,
  audio_generations_used_this_period INTEGER NOT NULL DEFAULT 0,
  is_annual BOOLEAN NOT NULL DEFAULT false,
  stripe_subscription_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- 3. Table des limites par tier d'abonnement
CREATE TABLE public.subscription_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tier subscription_tier NOT NULL UNIQUE,
  stories_per_month INTEGER NOT NULL,
  max_children INTEGER,
  has_story_series BOOLEAN NOT NULL DEFAULT false,
  has_background_music BOOLEAN NOT NULL DEFAULT false,
  audio_generations_per_month INTEGER NOT NULL DEFAULT 0,
  has_priority_access BOOLEAN NOT NULL DEFAULT false,
  has_community_access BOOLEAN NOT NULL DEFAULT false,
  monthly_price_usd DECIMAL(10,2) NOT NULL,
  annual_price_usd DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Activer RLS sur les nouvelles tables
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_limits ENABLE ROW LEVEL SECURITY;

-- 5. Politiques RLS pour user_subscriptions
CREATE POLICY "Users can view their own subscription"
ON public.user_subscriptions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscription"
ON public.user_subscriptions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription"
ON public.user_subscriptions
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all subscriptions"
ON public.user_subscriptions
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 6. Politiques RLS pour subscription_limits
CREATE POLICY "Everyone can view subscription limits"
ON public.subscription_limits
FOR SELECT
USING (true);

CREATE POLICY "Only admins can modify subscription limits"
ON public.subscription_limits
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 7. Insérer les limites par défaut pour chaque tier
INSERT INTO public.subscription_limits (tier, stories_per_month, max_children, has_story_series, has_background_music, audio_generations_per_month, has_priority_access, has_community_access, monthly_price_usd, annual_price_usd) VALUES
('calmini', 10, 5, false, false, 0, false, false, 2.00, 19.20),
('calmidium', 30, 10, true, false, 0, false, false, 5.00, 48.00),
('calmix', 50, NULL, true, true, 1, true, true, 10.00, 96.00),
('calmixxl', 100, NULL, true, true, 4, true, true, 20.00, 192.00);

-- 8. Fonction pour vérifier les quotas d'un utilisateur
CREATE OR REPLACE FUNCTION public.check_user_quota(p_user_id UUID, p_quota_type TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_sub RECORD;
  limits RECORD;
  result JSON;
BEGIN
  -- Récupérer l'abonnement utilisateur
  SELECT * INTO user_sub
  FROM public.user_subscriptions
  WHERE user_id = p_user_id;
  
  -- Si pas d'abonnement, créer un abonnement trial calmini
  IF user_sub IS NULL THEN
    INSERT INTO public.user_subscriptions (user_id, tier, status, current_period_end)
    VALUES (p_user_id, 'calmini', 'trial', now() + interval '1 month')
    RETURNING * INTO user_sub;
  END IF;
  
  -- Récupérer les limites pour ce tier
  SELECT * INTO limits
  FROM public.subscription_limits
  WHERE tier = user_sub.tier;
  
  -- Vérifier selon le type de quota
  CASE p_quota_type
    WHEN 'stories' THEN
      result := json_build_object(
        'allowed', user_sub.stories_used_this_period < limits.stories_per_month,
        'used', user_sub.stories_used_this_period,
        'limit', limits.stories_per_month,
        'tier', user_sub.tier
      );
    WHEN 'audio' THEN
      result := json_build_object(
        'allowed', user_sub.audio_generations_used_this_period < limits.audio_generations_per_month,
        'used', user_sub.audio_generations_used_this_period,
        'limit', limits.audio_generations_per_month,
        'tier', user_sub.tier
      );
    WHEN 'children' THEN
      DECLARE
        current_children_count INTEGER;
      BEGIN
        SELECT COUNT(*) INTO current_children_count
        FROM public.children
        WHERE authorid = p_user_id;
        
        result := json_build_object(
          'allowed', limits.max_children IS NULL OR current_children_count < limits.max_children,
          'used', current_children_count,
          'limit', limits.max_children,
          'tier', user_sub.tier
        );
      END;
    ELSE
      result := json_build_object('error', 'Unknown quota type');
  END CASE;
  
  RETURN result;
END;
$$;

-- 9. Fonction pour incrémenter l'usage
CREATE OR REPLACE FUNCTION public.increment_usage(p_user_id UUID, p_usage_type TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  CASE p_usage_type
    WHEN 'story' THEN
      UPDATE public.user_subscriptions
      SET stories_used_this_period = stories_used_this_period + 1,
          updated_at = now()
      WHERE user_id = p_user_id;
    WHEN 'audio' THEN
      UPDATE public.user_subscriptions
      SET audio_generations_used_this_period = audio_generations_used_this_period + 1,
          updated_at = now()
      WHERE user_id = p_user_id;
  END CASE;
  
  RETURN true;
END;
$$;

-- 10. Fonction pour reset automatique mensuel
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

-- 11. Trigger pour mettre à jour updated_at
CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER update_subscription_limits_updated_at
  BEFORE UPDATE ON public.subscription_limits
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 12. Migrer tous les utilisateurs existants vers le niveau 3 (calmix)
INSERT INTO public.user_subscriptions (user_id, tier, status, current_period_start, current_period_end)
SELECT 
  id,
  'calmix'::subscription_tier,
  'active',
  now(),
  now() + interval '1 month'
FROM public.users
WHERE id NOT IN (SELECT user_id FROM public.user_subscriptions);

-- 13. Fonction pour vérifier l'accès aux fonctionnalités
CREATE OR REPLACE FUNCTION public.has_feature_access(p_user_id UUID, p_feature TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_tier subscription_tier;
  limits RECORD;
BEGIN
  -- Récupérer le tier de l'utilisateur
  SELECT tier INTO user_tier
  FROM public.user_subscriptions
  WHERE user_id = p_user_id AND status IN ('active', 'trial');
  
  -- Si pas d'abonnement, niveau calmini par défaut
  IF user_tier IS NULL THEN
    user_tier := 'calmini';
  END IF;
  
  -- Récupérer les limites
  SELECT * INTO limits
  FROM public.subscription_limits
  WHERE tier = user_tier;
  
  -- Vérifier l'accès selon la fonctionnalité
  CASE p_feature
    WHEN 'story_series' THEN
      RETURN limits.has_story_series;
    WHEN 'background_music' THEN
      RETURN limits.has_background_music;
    WHEN 'priority_access' THEN
      RETURN limits.has_priority_access;
    WHEN 'community_access' THEN
      RETURN limits.has_community_access;
    WHEN 'audio_generation' THEN
      RETURN limits.audio_generations_per_month > 0;
    ELSE
      RETURN false;
  END CASE;
END;
$$;