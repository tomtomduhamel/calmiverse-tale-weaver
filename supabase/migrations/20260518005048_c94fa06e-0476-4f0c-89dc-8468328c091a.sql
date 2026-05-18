
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;

-- Existing users (created before onboarding existed) should not be forced through the wizard
UPDATE public.users
SET onboarding_completed = true
WHERE created_at < now();
