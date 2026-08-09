-- 1. Add category and category_name columns to user_voices and voice_invitations tables
ALTER TABLE public.user_voices 
ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'narrator_family',
ADD COLUMN IF NOT EXISTS category_name TEXT;

ALTER TABLE public.voice_invitations
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'narrator_family',
ADD COLUMN IF NOT EXISTS category_name TEXT;

-- 2. Create table for user custom voice categories
CREATE TABLE IF NOT EXISTS public.user_voice_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  label TEXT NOT NULL,
  icon TEXT DEFAULT 'Sparkles',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT user_voice_categories_user_slug_unique UNIQUE(user_id, slug)
);

-- Enable RLS for user_voice_categories
ALTER TABLE public.user_voice_categories ENABLE ROW LEVEL SECURITY;

-- Create policy for user_voice_categories
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_voice_categories' AND policyname = 'Users can manage their own categories'
  ) THEN
    CREATE POLICY "Users can manage their own categories" ON public.user_voice_categories
      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- 3. Backfill existing user voices to their appropriate categories based on their relation string
UPDATE public.user_voices 
SET category = 'animal_land' 
WHERE lower(relation) ~ 'ours|chien|chat|renard|loup|terrestre' AND category = 'narrator_family';

UPDATE public.user_voices 
SET category = 'animal_flying' 
WHERE lower(relation) ~ 'oiseau|chouette|hibou|volant|aigle|dragon' AND category = 'narrator_family';

UPDATE public.user_voices 
SET category = 'animal_aquatic' 
WHERE lower(relation) ~ 'dauphin|baleine|poisson|aquatique|marin|mer|requin|sirène' AND category = 'narrator_family';

UPDATE public.user_voices 
SET category = 'children' 
WHERE lower(relation) ~ 'enfant|garçon|fille|bébé|gustave|prince|princesse' AND category = 'narrator_family';

UPDATE public.user_voices 
SET category = 'magical_creatures' 
WHERE lower(relation) ~ 'monstre|magique|troll|géant|robot|lutin|fée' AND category = 'narrator_family';
