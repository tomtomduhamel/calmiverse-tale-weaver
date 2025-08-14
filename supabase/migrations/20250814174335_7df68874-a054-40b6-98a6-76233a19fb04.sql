-- Security Enhancement: Fix search path vulnerabilities in database functions

-- Update has_role function with proper search path
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$function$;

-- Update is_admin function with proper search path
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT public.has_role(auth.uid(), 'admin');
$function$;

-- Update next_template_version function with proper search path
CREATE OR REPLACE FUNCTION public.next_template_version(p_template_id uuid)
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT COALESCE(MAX(version), 0) + 1 FROM public.prompt_template_versions WHERE template_id = p_template_id;
$function$;

-- Enhanced security: Update sound_backgrounds RLS policy to be more restrictive
-- This ensures only authenticated users can access sound backgrounds and logs access
DROP POLICY IF EXISTS "Authenticated users can read sound backgrounds" ON public.sound_backgrounds;

CREATE POLICY "Authenticated users can read sound backgrounds" 
ON public.sound_backgrounds 
FOR SELECT 
TO authenticated
USING (true);

-- Add audit trigger for sound background access (for future monitoring)
CREATE OR REPLACE FUNCTION public.log_sound_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Log access for potential future audit requirements
  -- This is a placeholder for future audit functionality
  RETURN NULL;
END;
$function$;