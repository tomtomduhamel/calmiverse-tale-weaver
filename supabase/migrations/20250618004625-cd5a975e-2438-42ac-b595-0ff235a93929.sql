
-- Ajouter la colonne is_favorite à la table stories
ALTER TABLE public.stories 
ADD COLUMN is_favorite boolean DEFAULT false;

-- Mettre à jour les histoires existantes pour avoir is_favorite = false par défaut
UPDATE public.stories 
SET is_favorite = false 
WHERE is_favorite IS NULL;

-- Rendre la colonne non-nullable maintenant que toutes les valeurs sont définies
ALTER TABLE public.stories 
ALTER COLUMN is_favorite SET NOT NULL;
