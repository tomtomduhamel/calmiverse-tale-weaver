-- Fix the remaining database functions that still need search_path

-- Fix get_next_tome_number function  
CREATE OR REPLACE FUNCTION public.get_next_tome_number(p_series_id uuid)
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(MAX(tome_number), 0) + 1 
  FROM public.stories 
  WHERE series_id = p_series_id;
$$;

-- Fix next_template_version function
CREATE OR REPLACE FUNCTION public.next_template_version(p_template_id uuid)
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(MAX(version), 0) + 1 FROM public.prompt_template_versions WHERE template_id = p_template_id;
$$;

-- Fix log_sound_access function
CREATE OR REPLACE FUNCTION public.log_sound_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log access for potential future audit requirements
  -- This is a placeholder for future audit functionality
  RETURN NULL;
END;
$$;

-- Fix update_series_tome_count function
CREATE OR REPLACE FUNCTION public.update_series_tome_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Fix generate_deduplication_key function
CREATE OR REPLACE FUNCTION public.generate_deduplication_key(p_title text, p_authorid uuid, p_objective text DEFAULT NULL::text, p_children_names text[] DEFAULT NULL::text[])
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Générer un hash basé sur les paramètres critiques
  RETURN encode(
    digest(
      COALESCE(p_title, '') || '|' || 
      COALESCE(p_authorid::text, '') || '|' || 
      COALESCE(p_objective, '') || '|' || 
      COALESCE(array_to_string(p_children_names, ','), ''), 
      'sha256'
    ), 
    'hex'
  );
END;
$$;

-- Fix set_story_deduplication_key function
CREATE OR REPLACE FUNCTION public.set_story_deduplication_key()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Générer la clé de déduplication si elle n'existe pas
  IF NEW.deduplication_key IS NULL THEN
    NEW.deduplication_key = public.generate_deduplication_key(
      NEW.title,
      NEW.authorid,
      NEW.objective,
      NEW.childrennames
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Fix check_story_duplicate function
CREATE OR REPLACE FUNCTION public.check_story_duplicate(p_title text, p_authorid uuid, p_objective text DEFAULT NULL::text, p_children_names text[] DEFAULT NULL::text[])
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  dedup_key TEXT;
  existing_count INTEGER;
BEGIN
  -- Générer la clé de déduplication
  dedup_key = public.generate_deduplication_key(p_title, p_authorid, p_objective, p_children_names);
  
  -- Vérifier si une histoire avec cette clé existe déjà
  SELECT COUNT(*) INTO existing_count
  FROM public.stories
  WHERE deduplication_key = dedup_key;
  
  -- Retourner TRUE si un doublon existe
  RETURN existing_count > 0;
END;
$$;