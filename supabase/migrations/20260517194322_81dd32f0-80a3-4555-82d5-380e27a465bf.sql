CREATE OR REPLACE FUNCTION public.check_user_quota(p_user_id uuid, p_quota_type text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    AND status IN ('active', 'trial');
  
  IF user_sub IS NULL THEN
    RETURN json_build_object(
      'allowed', false,
      'used', 0,
      'limit', 0,
      'tier', 'none',
      'reason', 'Aucun abonnement actif'
    );
  END IF;
  
  SELECT * INTO limits
  FROM public.subscription_limits
  WHERE tier = user_sub.tier;
  
  CASE p_quota_type
    WHEN 'stories' THEN
      RETURN json_build_object(
        'allowed', user_sub.stories_used_this_period < limits.stories_per_month,
        'used', user_sub.stories_used_this_period,
        'limit', limits.stories_per_month,
        'tier', user_sub.tier
      );
    WHEN 'audio' THEN
      RETURN json_build_object(
        'allowed', user_sub.audio_generations_used_this_period < limits.audio_generations_per_month,
        'used', user_sub.audio_generations_used_this_period,
        'limit', limits.audio_generations_per_month,
        'tier', user_sub.tier
      );
    WHEN 'children' THEN
      RETURN json_build_object(
        'allowed', limits.max_children IS NULL OR (
          SELECT COUNT(*) FROM public.children WHERE authorid = p_user_id
        ) < limits.max_children,
        'used', (SELECT COUNT(*) FROM public.children WHERE authorid = p_user_id),
        'limit', COALESCE(limits.max_children, 999999),
        'tier', user_sub.tier
      );
    WHEN 'video_intro' THEN
      RETURN json_build_object(
        'allowed', COALESCE(user_sub.video_intros_used_this_period, 0) < COALESCE(limits.max_video_intros_per_period, 0),
        'used', COALESCE(user_sub.video_intros_used_this_period, 0),
        'limit', COALESCE(limits.max_video_intros_per_period, 0),
        'tier', user_sub.tier
      );
    ELSE
      RETURN json_build_object(
        'allowed', false,
        'reason', 'Type de quota inconnu'
      );
  END CASE;
END;
$function$;