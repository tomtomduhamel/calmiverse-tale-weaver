-- Fonctionnalité "Création automatique d'histoires" (routines planifiées).
-- Un workflow n8n interroge toutes les 5 min l'Edge Function due-story-routines,
-- qui réclame les routines dues et renvoie les jobs de génération à dispatcher.

-- 1. Droit premium "auto_creation" (disponible à partir du tier calmix)
ALTER TABLE public.subscription_limits
  ADD COLUMN IF NOT EXISTS has_auto_creation BOOLEAN NOT NULL DEFAULT false;

UPDATE public.subscription_limits SET has_auto_creation = true  WHERE tier IN ('calmix', 'calmixxl');
UPDATE public.subscription_limits SET has_auto_creation = false WHERE tier IN ('calmini', 'calmidium');

-- Étendre has_feature_access avec la nouvelle feature
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
    ELSE
      RETURN false;
  END CASE;
END;
$$;

-- 2. Table des routines
CREATE TABLE public.story_routines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Mode de création
  mode TEXT NOT NULL CHECK (mode IN ('guided', 'fast')),
  objective TEXT,                 -- guided
  child_ids UUID[],               -- guided
  fast_story_prompt_key TEXT,     -- fast
  duration_minutes INTEGER NOT NULL DEFAULT 10,
  generate_video BOOLEAN NOT NULL DEFAULT false,

  -- Récurrence
  schedule_type TEXT NOT NULL CHECK (schedule_type IN ('weekly', 'interval')),
  days_of_week INTEGER[],         -- weekly : ISO 1=lundi .. 7=dimanche
  interval_days INTEGER,          -- interval : tous les N jours
  time_of_day TIME NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'Europe/Paris',

  -- État
  is_active BOOLEAN NOT NULL DEFAULT true,
  next_run_at TIMESTAMP WITH TIME ZONE,
  last_run_at TIMESTAMP WITH TIME ZONE,
  last_story_id UUID,
  last_skip_reason TEXT,

  -- Conso mensuelle estimée (pour le contrôle "rentre dans le forfait")
  monthly_estimate INTEGER GENERATED ALWAYS AS (
    CASE
      WHEN schedule_type = 'weekly'
        THEN CEIL(COALESCE(array_length(days_of_week, 1), 0) * 4.33)::int
      WHEN schedule_type = 'interval'
        THEN CEIL(30.0 / NULLIF(interval_days, 0))::int
      ELSE 0
    END
  ) STORED,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),

  -- Cohérence des champs selon le mode / la récurrence
  CONSTRAINT story_routines_guided_fields CHECK (
    mode <> 'guided'
    OR (objective IS NOT NULL AND child_ids IS NOT NULL AND array_length(child_ids, 1) >= 1)
  ),
  CONSTRAINT story_routines_fast_fields CHECK (
    mode <> 'fast' OR fast_story_prompt_key IS NOT NULL
  ),
  CONSTRAINT story_routines_weekly_fields CHECK (
    schedule_type <> 'weekly'
    OR (days_of_week IS NOT NULL AND array_length(days_of_week, 1) >= 1)
  ),
  CONSTRAINT story_routines_interval_fields CHECK (
    schedule_type <> 'interval' OR (interval_days IS NOT NULL AND interval_days >= 1)
  )
);

CREATE INDEX idx_story_routines_due
  ON public.story_routines (next_run_at)
  WHERE is_active = true;
CREATE INDEX idx_story_routines_user ON public.story_routines (user_id);

-- 3. RLS : chaque utilisateur gère ses propres routines
ALTER TABLE public.story_routines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own routines"
  ON public.story_routines FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own routines"
  ON public.story_routines FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own routines"
  ON public.story_routines FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own routines"
  ON public.story_routines FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all routines"
  ON public.story_routines FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 4. Calcul de la prochaine exécution (dans le fuseau de la routine)
CREATE OR REPLACE FUNCTION public.compute_next_run(
  p_schedule_type TEXT,
  p_days_of_week INTEGER[],
  p_interval_days INTEGER,
  p_time_of_day TIME,
  p_timezone TEXT,
  p_from TIMESTAMP WITH TIME ZONE DEFAULT now()
)
RETURNS TIMESTAMP WITH TIME ZONE
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  base_date DATE := (p_from AT TIME ZONE p_timezone)::date;
  cand_wall TIMESTAMP;
  d DATE;
  i INTEGER;
BEGIN
  IF p_schedule_type = 'interval' THEN
    cand_wall := base_date + p_time_of_day;
    IF (cand_wall AT TIME ZONE p_timezone) <= p_from THEN
      cand_wall := cand_wall + make_interval(days => p_interval_days);
    END IF;
    RETURN cand_wall AT TIME ZONE p_timezone;
  ELSE
    FOR i IN 0..7 LOOP
      d := base_date + i;
      IF EXTRACT(ISODOW FROM d)::int = ANY(p_days_of_week) THEN
        cand_wall := d + p_time_of_day;
        IF (cand_wall AT TIME ZONE p_timezone) > p_from THEN
          RETURN cand_wall AT TIME ZONE p_timezone;
        END IF;
      END IF;
    END LOOP;
    RETURN NULL;
  END IF;
END;
$$;

-- 5. Contrôle "rentre dans le forfait" : la somme des routines actives ne doit
--    pas dépasser le quota mensuel d'histoires du tier.
CREATE OR REPLACE FUNCTION public.check_auto_routine_quota(
  p_user_id UUID,
  p_candidate_monthly INTEGER,
  p_exclude_routine UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_limit INTEGER;
  v_existing INTEGER;
  v_total INTEGER;
BEGIN
  SELECT sl.stories_per_month INTO v_limit
  FROM public.user_subscriptions us
  JOIN public.subscription_limits sl ON sl.tier = us.tier
  WHERE us.user_id = p_user_id AND us.status IN ('active', 'trial')
  LIMIT 1;

  IF v_limit IS NULL THEN
    SELECT stories_per_month INTO v_limit FROM public.subscription_limits WHERE tier = 'calmini';
  END IF;

  SELECT COALESCE(SUM(monthly_estimate), 0) INTO v_existing
  FROM public.story_routines
  WHERE user_id = p_user_id
    AND is_active = true
    AND (p_exclude_routine IS NULL OR id <> p_exclude_routine);

  v_total := v_existing + GREATEST(COALESCE(p_candidate_monthly, 0), 0);

  RETURN json_build_object(
    'allowed', v_total <= v_limit,
    'projected', v_total,
    'existing', v_existing,
    'limit', v_limit
  );
END;
$$;

-- 6. Réclamation atomique des routines dues (FOR UPDATE SKIP LOCKED + avance next_run_at)
CREATE OR REPLACE FUNCTION public.claim_due_routines(p_limit INTEGER DEFAULT 50)
RETURNS SETOF public.story_routines
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  UPDATE public.story_routines sr
  SET last_run_at = now(),
      next_run_at = public.compute_next_run(
        sr.schedule_type, sr.days_of_week, sr.interval_days, sr.time_of_day, sr.timezone, now()
      ),
      updated_at = now()
  WHERE sr.id IN (
    SELECT id FROM public.story_routines
    WHERE is_active = true
      AND next_run_at IS NOT NULL
      AND next_run_at <= now()
    ORDER BY next_run_at
    LIMIT p_limit
    FOR UPDATE SKIP LOCKED
  )
  RETURNING sr.*;
END;
$$;
