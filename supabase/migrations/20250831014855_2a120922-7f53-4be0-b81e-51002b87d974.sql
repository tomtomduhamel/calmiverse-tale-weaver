-- Fix remaining database functions with proper search_path

-- Fix update_children_updatedat function
CREATE OR REPLACE FUNCTION public.update_children_updatedat()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.createdat = COALESCE(NEW.createdat, now());
  NEW.authorid = COALESCE(NEW.authorid, auth.uid());
  RETURN NEW;
END;
$$;

-- Fix update_timestamp function
CREATE OR REPLACE FUNCTION public.update_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updatedAt = now();
  RETURN NEW;
END;
$$;

-- Fix set_updated_at function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Fix update_audio_files_updated_at function
CREATE OR REPLACE FUNCTION public.update_audio_files_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Fix set_story_author function
CREATE OR REPLACE FUNCTION public.set_story_author()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Auto-assigner l'authorid si non défini
  IF NEW.authorid IS NULL THEN
    NEW.authorid = auth.uid();
  END IF;
  
  -- S'assurer que l'utilisateur ne peut assigner que son propre ID
  IF NEW.authorid != auth.uid() THEN
    RAISE EXCEPTION 'Cannot assign story to different user';
  END IF;
  
  RETURN NEW;
END;
$$;