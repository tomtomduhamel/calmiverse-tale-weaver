-- Ajouter une colonne image_path à la table story_series
ALTER TABLE public.story_series 
ADD COLUMN image_path text;

-- Ajouter un commentaire pour documenter la colonne
COMMENT ON COLUMN public.story_series.image_path IS 'Chemin ou URL de l''image de couverture de la série d''histoires';