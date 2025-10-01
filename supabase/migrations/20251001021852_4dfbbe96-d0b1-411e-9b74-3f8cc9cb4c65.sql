-- Fonction PostgreSQL optimisée pour compter les histoires par enfant en UNE SEULE requête
-- Cette fonction remplace les 24 requêtes HEAD individuelles

CREATE OR REPLACE FUNCTION public.get_stories_count_by_children(p_user_id uuid)
RETURNS TABLE (
  child_id text,
  story_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Compter toutes les histoires pour chaque enfant de l'utilisateur en une seule requête
  RETURN QUERY
  SELECT 
    unnest(s.childrenids) as child_id,
    COUNT(*) as story_count
  FROM public.stories s
  WHERE s.authorid = p_user_id
  GROUP BY unnest(s.childrenids);
END;
$$;

-- Index pour optimiser cette requête
CREATE INDEX IF NOT EXISTS idx_stories_childrenids_gin ON public.stories USING GIN (childrenids);
CREATE INDEX IF NOT EXISTS idx_stories_authorid_childrenids ON public.stories (authorid) INCLUDE (childrenids);

COMMENT ON FUNCTION public.get_stories_count_by_children IS 'Retourne le nombre d''histoires par enfant pour un utilisateur donné. Performance optimisée : 1 requête au lieu de N requêtes.';
