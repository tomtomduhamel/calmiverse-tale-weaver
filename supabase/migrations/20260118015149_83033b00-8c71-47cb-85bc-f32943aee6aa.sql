-- Ajouter les colonnes pour les vitesses de lecture personnalisées
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS custom_speed_slow integer DEFAULT 90,
ADD COLUMN IF NOT EXISTS custom_speed_normal integer DEFAULT 120,
ADD COLUMN IF NOT EXISTS custom_speed_fast integer DEFAULT 150;

-- Ajouter des contraintes de validation (50-200 mots/min)
ALTER TABLE public.users 
ADD CONSTRAINT check_custom_speed_slow CHECK (custom_speed_slow >= 50 AND custom_speed_slow <= 200),
ADD CONSTRAINT check_custom_speed_normal CHECK (custom_speed_normal >= 50 AND custom_speed_normal <= 200),
ADD CONSTRAINT check_custom_speed_fast CHECK (custom_speed_fast >= 50 AND custom_speed_fast <= 200);

-- Commentaires pour documentation
COMMENT ON COLUMN public.users.custom_speed_slow IS 'Vitesse personnalisée pour le mode Escargot (mots/min)';
COMMENT ON COLUMN public.users.custom_speed_normal IS 'Vitesse personnalisée pour le mode Tortue (mots/min)';
COMMENT ON COLUMN public.users.custom_speed_fast IS 'Vitesse personnalisée pour le mode Lapin (mots/min)';