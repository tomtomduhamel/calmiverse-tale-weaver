-- Update security definer functions to include explicit search_path for security hardening

-- Update the set_story_author function
CREATE OR REPLACE FUNCTION public.set_story_author()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
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
$function$;

-- Update the update_children_updatedat function
CREATE OR REPLACE FUNCTION public.update_children_updatedat()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  NEW.createdat = COALESCE(NEW.createdat, now());
  NEW.authorid = COALESCE(NEW.authorid, auth.uid());
  RETURN NEW;
END;
$function$;

-- Update the update_timestamp function
CREATE OR REPLACE FUNCTION public.update_timestamp()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  NEW.updatedAt = now();
  RETURN NEW;
END;
$function$;

-- Update the update_audio_files_updated_at function
CREATE OR REPLACE FUNCTION public.update_audio_files_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Enhance the delete_user function to handle all cascade deletions securely
CREATE OR REPLACE FUNCTION public.delete_user()
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid;
BEGIN
  -- Récupérer l'ID de l'utilisateur connecté
  current_user_id := auth.uid();
  
  -- Vérification que l'utilisateur est connecté
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Vous devez être connecté pour effectuer cette action';
  END IF;

  -- Supprimer les données des tables associées dans le bon ordre
  -- (pour respecter les contraintes de clés étrangères)
  
  -- Supprimer les fichiers audio associés aux histoires de l'utilisateur
  DELETE FROM public.audio_files 
  WHERE story_id IN (SELECT id FROM public.stories WHERE authorid = current_user_id);
  
  -- Supprimer les logs d'accès aux histoires
  DELETE FROM public.story_access_logs 
  WHERE story_id IN (SELECT id FROM public.stories WHERE authorid = current_user_id);
  
  -- Supprimer les enfants et histoires
  DELETE FROM public.children WHERE authorid = current_user_id;
  DELETE FROM public.stories WHERE authorid = current_user_id;
  DELETE FROM public.users WHERE id = current_user_id;
  
  -- Log de l'opération pour audit
  RAISE NOTICE 'Compte utilisateur % supprimé avec succès', current_user_id;
END;
$$;

-- Ensure proper permissions
GRANT EXECUTE ON FUNCTION public.delete_user() TO authenticated;