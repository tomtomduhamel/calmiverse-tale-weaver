
-- Fonction is_super_admin()
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT public.has_role(auth.uid(), 'super_admin');
$$;

-- Table stripe_webhook_events
CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id text UNIQUE,
  type text NOT NULL,
  status text NOT NULL DEFAULT 'success',
  payload jsonb,
  error_message text,
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_swe_created_at ON public.stripe_webhook_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_swe_type ON public.stripe_webhook_events (type);
CREATE INDEX IF NOT EXISTS idx_swe_status ON public.stripe_webhook_events (status);

ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admin can view webhook events"
ON public.stripe_webhook_events FOR SELECT
USING (public.is_super_admin());

CREATE POLICY "System can insert webhook events"
ON public.stripe_webhook_events FOR INSERT
WITH CHECK (true);

-- Politiques superadmin additionnelles
CREATE POLICY "Super admin can view all subscriptions"
ON public.user_subscriptions FOR SELECT
USING (public.is_super_admin());

CREATE POLICY "Super admin can update all subscriptions"
ON public.user_subscriptions FOR UPDATE
USING (public.is_super_admin());

CREATE POLICY "Super admin can view all users"
ON public.users FOR SELECT
USING (public.is_super_admin());

CREATE POLICY "Super admin manages price mapping"
ON public.stripe_price_mapping FOR ALL
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

-- Attribution du rôle super_admin (cast via texte pour éviter le bug d'enum en transaction)
INSERT INTO public.user_roles (user_id, role)
VALUES ('59d2c73c-673c-4022-8f0e-a74d23975560', 'super_admin'::public.app_role)
ON CONFLICT DO NOTHING;
