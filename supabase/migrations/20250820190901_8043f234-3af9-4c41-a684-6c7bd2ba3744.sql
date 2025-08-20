-- Migration pour la fonctionnalité de suites d'histoires (tomes)

-- 1. Ajouter les colonnes à la table stories pour les séries
ALTER TABLE public.stories 
ADD COLUMN series_id uuid,
ADD COLUMN tome_number integer,
ADD COLUMN is_series_starter boolean DEFAULT false,
ADD COLUMN previous_story_id uuid,
ADD COLUMN next_story_id uuid;

-- 2. Créer la table story_series pour gérer les séries/sagas
CREATE TABLE public.story_series (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  author_id uuid NOT NULL,
  total_tomes integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true
);

-- 3. Activer RLS sur la nouvelle table
ALTER TABLE public.story_series ENABLE ROW LEVEL SECURITY;

-- 4. Politiques RLS pour story_series
CREATE POLICY "Users can view their own series"
ON public.story_series
FOR SELECT
USING (auth.uid() = author_id);

CREATE POLICY "Users can create their own series"
ON public.story_series
FOR INSERT
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own series"
ON public.story_series
FOR UPDATE
USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own series"
ON public.story_series
FOR DELETE
USING (auth.uid() = author_id);

-- 5. Trigger pour mettre à jour updated_at sur story_series
CREATE TRIGGER update_story_series_updated_at
  BEFORE UPDATE ON public.story_series
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 6. Index pour optimiser les requêtes
CREATE INDEX idx_stories_series_id ON stories(series_id);
CREATE INDEX idx_stories_tome_number ON stories(series_id, tome_number);
CREATE INDEX idx_story_series_author_id ON story_series(author_id);

-- 7. Fonction pour générer automatiquement le prochain numéro de tome
CREATE OR REPLACE FUNCTION public.get_next_tome_number(p_series_id uuid)
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT COALESCE(MAX(tome_number), 0) + 1 
  FROM public.stories 
  WHERE series_id = p_series_id;
$$;

-- 8. Fonction pour mettre à jour le total_tomes dans story_series
CREATE OR REPLACE FUNCTION public.update_series_tome_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Mettre à jour le nombre total de tomes quand une histoire est ajoutée à une série
  IF NEW.series_id IS NOT NULL THEN
    UPDATE public.story_series 
    SET total_tomes = (
      SELECT COUNT(*) 
      FROM public.stories 
      WHERE series_id = NEW.series_id
    ),
    updated_at = now()
    WHERE id = NEW.series_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 9. Trigger pour maintenir automatiquement le count des tomes
CREATE TRIGGER update_series_tome_count_trigger
  AFTER INSERT OR UPDATE OF series_id ON public.stories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_series_tome_count();