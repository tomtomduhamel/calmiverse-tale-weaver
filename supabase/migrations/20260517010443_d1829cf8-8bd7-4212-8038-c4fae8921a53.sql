-- Add Stripe customer + price tracking to user_subscriptions
ALTER TABLE public.user_subscriptions
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_customer
  ON public.user_subscriptions(stripe_customer_id);

-- Mapping table : tier + cadence -> Stripe price_id
CREATE TABLE IF NOT EXISTS public.stripe_price_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier subscription_tier NOT NULL,
  is_annual BOOLEAN NOT NULL DEFAULT false,
  stripe_price_id TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tier, is_annual)
);

ALTER TABLE public.stripe_price_mapping ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can read the mapping (needed by frontend / edge fn)
CREATE POLICY "Anyone can read active stripe price mapping"
  ON public.stripe_price_mapping
  FOR SELECT
  USING (active = true);

-- Only admins can manage it
CREATE POLICY "Admins manage stripe price mapping"
  ON public.stripe_price_mapping
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE TRIGGER trg_stripe_price_mapping_updated_at
  BEFORE UPDATE ON public.stripe_price_mapping
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();