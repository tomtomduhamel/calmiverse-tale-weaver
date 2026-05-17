-- =========================================================
-- 1. RÉPARATION DU COMPTE D'ANTHONY RENARD
-- =========================================================

-- 1a. Créer son profil public.users manquant
INSERT INTO public.users (id, email, created_at)
VALUES ('f997ee22-e15f-41c1-bccb-6305d8f305a2', 'anthonyrenard5@hotmail.com', now())
ON CONFLICT (id) DO NOTHING;

-- 1b. Créer son entrée beta_users en attente de validation admin
INSERT INTO public.beta_users (user_id, email, invitation_code, status, requested_at)
VALUES ('f997ee22-e15f-41c1-bccb-6305d8f305a2', 'anthonyrenard5@hotmail.com', 'DIRECT', 'pending_validation', now())
ON CONFLICT DO NOTHING;

-- 1c. Lui créer un trial Calmini de 30 jours
INSERT INTO public.user_subscriptions
  (user_id, tier, status, current_period_start, current_period_end,
   stories_used_this_period, audio_generations_used_this_period)
VALUES
  ('f997ee22-e15f-41c1-bccb-6305d8f305a2', 'calmini', 'trial',
   now(), now() + interval '30 days', 0, 0)
ON CONFLICT (user_id) DO NOTHING;

-- =========================================================
-- 2. TRIGGER : auto-création de public.users + trial à l'inscription
-- =========================================================

CREATE OR REPLACE FUNCTION public.handle_new_user_bootstrap()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- a. Créer le profil public.users
  INSERT INTO public.users (id, email, created_at)
  VALUES (NEW.id, NEW.email, now())
  ON CONFLICT (id) DO NOTHING;

  -- b. Créer un trial Calmini de 30 jours
  INSERT INTO public.user_subscriptions (
    user_id, tier, status,
    current_period_start, current_period_end,
    stories_used_this_period, audio_generations_used_this_period
  ) VALUES (
    NEW.id, 'calmini', 'trial',
    now(), now() + interval '30 days', 0, 0
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_bootstrap ON auth.users;
CREATE TRIGGER on_auth_user_created_bootstrap
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_bootstrap();