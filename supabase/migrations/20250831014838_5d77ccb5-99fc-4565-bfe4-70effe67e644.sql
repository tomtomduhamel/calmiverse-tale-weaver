-- Fix database security issues

-- 1. Secure the delete_user function with proper search_path
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

-- 2. Add RLS policies for v_active_prompt_templates view
-- Note: Views inherit RLS from underlying tables, but we need to ensure proper access
DROP POLICY IF EXISTS "Admins can view active prompt templates" ON public.prompt_templates;
CREATE POLICY "Admins can view active prompt templates" 
ON public.prompt_templates 
FOR SELECT 
USING (public.is_admin());

-- 3. Secure sound_backgrounds access - restrict to authenticated users only
DROP POLICY IF EXISTS "Authenticated users can read sound backgrounds" ON public.sound_backgrounds;
CREATE POLICY "Authenticated users can read sound backgrounds" 
ON public.sound_backgrounds 
FOR SELECT 
TO authenticated
USING (true);

-- 4. Add audit logging function for role changes
CREATE OR REPLACE FUNCTION public.audit_role_changes()
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log role changes for security audit
  IF TG_OP = 'INSERT' THEN
    RAISE NOTICE 'Role % assigned to user % by %', NEW.role, NEW.user_id, auth.uid();
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    RAISE NOTICE 'Role changed from % to % for user % by %', OLD.role, NEW.role, NEW.user_id, auth.uid();
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    RAISE NOTICE 'Role % removed from user % by %', OLD.role, OLD.user_id, auth.uid();
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- 5. Create trigger for role change auditing
DROP TRIGGER IF EXISTS audit_user_roles_changes ON public.user_roles;
CREATE TRIGGER audit_user_roles_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_role_changes();

-- 6. Enhance user_roles RLS to prevent self-modification
DROP POLICY IF EXISTS "Prevent self role modification" ON public.user_roles;
CREATE POLICY "Prevent self role modification" 
ON public.user_roles 
FOR ALL 
TO authenticated
USING (
  -- Users cannot modify their own roles
  user_id != auth.uid() AND public.is_admin()
)
WITH CHECK (
  -- Users cannot assign roles to themselves
  user_id != auth.uid() AND public.is_admin()
);

-- 7. Fix other database functions with proper search_path
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin');
$$;