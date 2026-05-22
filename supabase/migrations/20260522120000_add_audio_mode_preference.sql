-- Préférence du moteur de lecture audio par utilisateur
-- 'browser' = Web Speech API (voix du navigateur, gratuit pour tous)
-- 'premium' = Speechify (voix premium, gated par feature audio_generation)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS audio_mode TEXT NOT NULL DEFAULT 'browser';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_audio_mode_check'
  ) THEN
    ALTER TABLE public.users
      ADD CONSTRAINT users_audio_mode_check CHECK (audio_mode IN ('browser', 'premium'));
  END IF;
END $$;

COMMENT ON COLUMN public.users.audio_mode IS 'Preference du moteur de lecture audio: browser (Web Speech API gratuit) ou premium (Speechify)';
