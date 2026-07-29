-- Migration: Add multivoice audio feature limit and update has_feature_access
-- Date: 2026-07-01

-- 1. Add column to subscription_limits
ALTER TABLE public.subscription_limits ADD COLUMN IF NOT EXISTS has_multivoice_audio BOOLEAN NOT NULL DEFAULT false;

-- 2. Update limits for plans
-- Only Calmix and Calmixxl get multivoice audio
UPDATE public.subscription_limits SET has_multivoice_audio = true WHERE tier IN ('calmix', 'calmixxl');
UPDATE public.subscription_limits SET has_multivoice_audio = false WHERE tier IN ('calmini', 'calmidium');

-- 3. Update has_feature_access function to support 'multivoice_audio'
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
  SELECT tier INTO user_tier
  FROM public.user_subscriptions
  WHERE user_id = p_user_id AND status IN ('active', 'trial');

  IF user_tier IS NULL THEN
    user_tier := 'calmini';
  END IF;

  SELECT * INTO limits
  FROM public.subscription_limits
  WHERE tier = user_tier;

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
    WHEN 'auto_creation' THEN
      RETURN COALESCE(limits.has_auto_creation, false);
    WHEN 'multivoice_audio' THEN
      RETURN COALESCE(limits.has_multivoice_audio, false);
    ELSE
      RETURN false;
  END CASE;
END;
$$;
