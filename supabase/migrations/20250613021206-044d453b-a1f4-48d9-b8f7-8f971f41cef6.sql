
-- Ajouter la colonne story_analysis à la table stories
ALTER TABLE public.stories 
ADD COLUMN story_analysis jsonb;

-- Ajouter un commentaire pour documenter la structure attendue
COMMENT ON COLUMN public.stories.story_analysis IS 'Analyse détaillée de l''histoire contenant: style de rédaction, mots-clés, tournures de phrases, structure narrative, caractéristiques des personnages, thèmes abordés';
