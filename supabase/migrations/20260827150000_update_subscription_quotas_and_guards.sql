-- Migration: Update subscription limits, feature access, and usage increment RPCs
-- Date: 2026-08-27

-- 1. Mise à jour des limites et quotas dans subscription_limits
UPDATE public.subscription_limits 
SET 
  stories_per_month = 10,
  max_children = 1,
  has_story_series = false,
  has_background_music = false,
  audio_generations_per_month = 0,
  max_voice_clones = 0,
  has_multivoice_audio = false,
  has_auto_creation = false,
  max_video_intros_per_period = 0,
  has_priority_access = false,
  monthly_price_usd = 2.00,
  annual_price_usd = 19.20,
  updated_at = now()
WHERE tier = 'calmini';

UPDATE public.subscription_limits 
SET 
  stories_per_month = 30,
  max_children = 2,
  has_story_series = true,
  has_background_music = true,
  audio_generations_per_month = 10,
  max_voice_clones = 1,
  has_multivoice_audio = false,
  has_auto_creation = false,
  max_video_intros_per_period = 0,
  has_priority_access = false,
  monthly_price_usd = 5.00,
  annual_price_usd = 48.00,
  updated_at = now()
WHERE tier = 'calmidium';

UPDATE public.subscription_limits 
SET 
  stories_per_month = 50,
  max_children = NULL, -- Illimité
  has_story_series = true,
  has_background_music = true,
  audio_generations_per_month = 20,
  max_voice_clones = 3,
  has_multivoice_audio = true,
  has_auto_creation = true,
  max_video_intros_per_period = 3,
  has_priority_access = true,
  monthly_price_usd = 10.00,
  annual_price_usd = 96.00,
  updated_at = now()
WHERE tier = 'calmix';

UPDATE public.subscription_limits 
SET 
  stories_per_month = 100,
  max_children = NULL, -- Illimité
  has_story_series = true,
  has_background_music = true,
  audio_generations_per_month = 40,
  max_voice_clones = 10,
  has_multivoice_audio = true,
  has_auto_creation = true,
  max_video_intros_per_period = 10,
  has_priority_access = true,
  monthly_price_usd = 20.00,
  annual_price_usd = 192.00,
  updated_at = now()
WHERE tier = 'calmixxl';

-- 2. Mise à jour de has_feature_access
CREATE OR REPLACE FUNCTION public.has_feature_access(p_user_id UUID, p_feature TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_sub RECORD;
  user_tier subscription_tier;
  limits RECORD;
  is_admin_user BOOLEAN;
BEGIN
  -- Vérifier si admin
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = p_user_id AND role = 'admin'
  ) INTO is_admin_user;

  IF is_admin_user THEN
    RETURN true;
  END IF;

  -- Récupérer l'abonnement
  SELECT * INTO user_sub
  FROM public.user_subscriptions
  WHERE user_id = p_user_id 
    AND status IN ('active', 'trial')
    AND current_period_end >= now();

  IF user_sub IS NULL THEN
    user_tier := 'calmini';
  ELSE
    user_tier := user_sub.tier;
  END IF;

  SELECT * INTO limits
  FROM public.subscription_limits
  WHERE tier = user_tier;

  IF limits IS NULL THEN
    RETURN false;
  END IF;

  CASE p_feature
    WHEN 'story_series' THEN
      RETURN COALESCE(limits.has_story_series, false);
    WHEN 'background_music' THEN
      RETURN COALESCE(limits.has_background_music, false);
    WHEN 'priority_access' THEN
      RETURN COALESCE(limits.has_priority_access, false);
    WHEN 'community_access' THEN
      RETURN COALESCE(limits.has_community_access, false);
    WHEN 'audio_generation' THEN
      RETURN COALESCE(limits.audio_generations_per_month, 0) > 0;
    WHEN 'auto_creation' THEN
      RETURN COALESCE(limits.has_auto_creation, false);
    WHEN 'multivoice_audio' THEN
      RETURN COALESCE(limits.has_multivoice_audio, false);
    WHEN 'kindle_export' THEN
      -- Accessible dès Calmidium (Calmidium, Calmix, Calmixxl)
      RETURN user_tier IN ('calmidium', 'calmix', 'calmixxl');
    WHEN 'family_sharing' THEN
      -- Accessible dès Calmidium (Calmidium, Calmix, Calmixxl)
      RETURN user_tier IN ('calmidium', 'calmix', 'calmixxl');
    WHEN 'voice_cloning' THEN
      RETURN COALESCE(limits.max_voice_clones, 0) > 0;
    ELSE
      RETURN false;
  END CASE;
END;
$$;

-- 3. Mise à jour de increment_usage pour supporter 'video_intro'
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
      SET stories_used_this_period = COALESCE(stories_used_this_period, 0) + 1,
          updated_at = now()
      WHERE user_id = p_user_id;
    WHEN 'audio' THEN
      UPDATE public.user_subscriptions
      SET audio_generations_used_this_period = COALESCE(audio_generations_used_this_period, 0) + 1,
          updated_at = now()
      WHERE user_id = p_user_id;
    WHEN 'video_intro' THEN
      UPDATE public.user_subscriptions
      SET video_intros_used_this_period = COALESCE(video_intros_used_this_period, 0) + 1,
          updated_at = now()
      WHERE user_id = p_user_id;
  END CASE;
  
  RETURN true;
END;
$$;

-- 4. Mise à jour de check_user_quota pour vérifier la validité de l'abonnement et supporter 'voice_clones'
CREATE OR REPLACE FUNCTION public.check_user_quota(p_user_id uuid, p_quota_type text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_sub RECORD;
  limits RECORD;
  is_admin_user BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = p_user_id AND role = 'admin'
  ) INTO is_admin_user;
  
  IF is_admin_user THEN
    RETURN json_build_object(
      'allowed', true,
      'used', 0,
      'limit', 999999,
      'tier', 'admin',
      'is_admin', true
    );
  END IF;
  
  SELECT * INTO user_sub
  FROM public.user_subscriptions
  WHERE user_id = p_user_id
    AND status IN ('active', 'trial')
    AND current_period_end >= now();
  
  IF user_sub IS NULL THEN
    RETURN json_build_object(
      'allowed', false,
      'used', 0,
      'limit', 0,
      'tier', 'none',
      'reason', 'Votre abonnement a expiré ou est inactif'
    );
  END IF;
  
  SELECT * INTO limits
  FROM public.subscription_limits
  WHERE tier = user_sub.tier;
  
  CASE p_quota_type
    WHEN 'stories' THEN
      RETURN json_build_object(
        'allowed', COALESCE(user_sub.stories_used_this_period, 0) < limits.stories_per_month,
        'used', COALESCE(user_sub.stories_used_this_period, 0),
        'limit', limits.stories_per_month,
        'tier', user_sub.tier
      );
    WHEN 'audio' THEN
      RETURN json_build_object(
        'allowed', COALESCE(user_sub.audio_generations_used_this_period, 0) < limits.audio_generations_per_month,
        'used', COALESCE(user_sub.audio_generations_used_this_period, 0),
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

        RETURN json_build_object(
          'allowed', limits.max_children IS NULL OR current_children_count < limits.max_children,
          'used', current_children_count,
          'limit', COALESCE(limits.max_children, 999999),
          'tier', user_sub.tier
        );
      END;
    WHEN 'video_intro' THEN
      RETURN json_build_object(
        'allowed', COALESCE(user_sub.video_intros_used_this_period, 0) < COALESCE(limits.max_video_intros_per_period, 0),
        'used', COALESCE(user_sub.video_intros_used_this_period, 0),
        'limit', COALESCE(limits.max_video_intros_per_period, 0),
        'tier', user_sub.tier
      );
    WHEN 'voice_clones' THEN
      DECLARE
        current_voices_count INTEGER;
      BEGIN
        SELECT COUNT(*) INTO current_voices_count
        FROM public.user_voices
        WHERE user_id = p_user_id;

        RETURN json_build_object(
          'allowed', current_voices_count < COALESCE(limits.max_voice_clones, 0),
          'used', current_voices_count,
          'limit', COALESCE(limits.max_voice_clones, 0),
          'tier', user_sub.tier
        );
      END;
    ELSE
      RETURN json_build_object(
        'allowed', false,
        'reason', 'Type de quota inconnu'
      );
  END CASE;
END;
$$;

-- 5. Mise à jour de reset_monthly_quotas
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
