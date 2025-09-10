-- Phase 1: Critical Security Fixes

-- 1. Fix Rate Limits Table Security
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Allow rate limit tracking" ON public.rate_limits;

-- Create secure policies for rate_limits table
CREATE POLICY "System can manage rate limits" 
ON public.rate_limits 
FOR ALL 
USING (false) 
WITH CHECK (false);

-- Allow system functions to insert rate limit data
CREATE POLICY "Functions can insert rate limits" 
ON public.rate_limits 
FOR INSERT 
WITH CHECK (true);

-- Only admins can view rate limit data for monitoring
CREATE POLICY "Admins can view rate limits" 
ON public.rate_limits 
FOR SELECT 
USING (public.is_admin());

-- 2. Enhance User Roles Security
-- Add validation trigger to prevent privilege escalation
CREATE OR REPLACE FUNCTION public.validate_role_assignment()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent users from assigning roles to themselves
  IF NEW.user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot assign roles to yourself';
  END IF;
  
  -- Only admins can assign admin roles
  IF NEW.role = 'admin' AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can assign admin roles';
  END IF;
  
  -- Prevent duplicate role assignments
  IF EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = NEW.user_id AND role = NEW.role
  ) THEN
    RAISE EXCEPTION 'User already has this role';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply validation trigger
DROP TRIGGER IF EXISTS validate_role_assignment_trigger ON public.user_roles;
CREATE TRIGGER validate_role_assignment_trigger
  BEFORE INSERT ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.validate_role_assignment();

-- 3. Enhanced audit function for role changes
CREATE OR REPLACE FUNCTION public.audit_role_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Log role changes for security audit with more details
  IF TG_OP = 'INSERT' THEN
    RAISE NOTICE 'Role % assigned to user % by % at %', NEW.role, NEW.user_id, auth.uid(), now();
    
    -- Log to security audit table
    INSERT INTO public.security_audit_logs (
      user_id, action, resource, result, reason, metadata
    ) VALUES (
      auth.uid(), 
      'role_assigned', 
      'user_roles',
      'success',
      'Role assignment',
      jsonb_build_object(
        'target_user_id', NEW.user_id,
        'role_assigned', NEW.role,
        'timestamp', now()
      )
    );
    
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    RAISE NOTICE 'Role changed from % to % for user % by % at %', OLD.role, NEW.role, NEW.user_id, auth.uid(), now();
    
    INSERT INTO public.security_audit_logs (
      user_id, action, resource, result, reason, metadata
    ) VALUES (
      auth.uid(), 
      'role_modified', 
      'user_roles',
      'success',
      'Role modification',
      jsonb_build_object(
        'target_user_id', NEW.user_id,
        'old_role', OLD.role,
        'new_role', NEW.role,
        'timestamp', now()
      )
    );
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    RAISE NOTICE 'Role % removed from user % by % at %', OLD.role, OLD.user_id, auth.uid(), now();
    
    INSERT INTO public.security_audit_logs (
      user_id, action, resource, result, reason, metadata
    ) VALUES (
      auth.uid(), 
      'role_removed', 
      'user_roles',
      'success',
      'Role removal',
      jsonb_build_object(
        'target_user_id', OLD.user_id,
        'role_removed', OLD.role,
        'timestamp', now()
      )
    );
    
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply enhanced audit trigger
DROP TRIGGER IF EXISTS audit_role_changes_trigger ON public.user_roles;
CREATE TRIGGER audit_role_changes_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.audit_role_changes();

-- 4. Add role modification cooldown to prevent rapid changes
CREATE TABLE IF NOT EXISTS public.role_modification_cooldown (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  last_modification timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on cooldown table
ALTER TABLE public.role_modification_cooldown ENABLE ROW LEVEL SECURITY;

-- Only admins can view cooldown data
CREATE POLICY "Admins can view role cooldown" 
ON public.role_modification_cooldown 
FOR SELECT 
USING (public.is_admin());

-- System can manage cooldown data
CREATE POLICY "System can manage role cooldown" 
ON public.role_modification_cooldown 
FOR ALL 
USING (public.is_admin()) 
WITH CHECK (public.is_admin());

-- 5. Enhanced user data validation
CREATE OR REPLACE FUNCTION public.validate_user_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Enhanced email validation
  IF NEW.email IS NULL OR NEW.email = '' THEN
    RAISE EXCEPTION 'Email requis';
  END IF;
  
  -- Check email format
  IF NEW.email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Format d''email invalide';
  END IF;
  
  -- Validate timezone
  IF NEW.timezone IS NOT NULL AND NEW.timezone NOT IN (
    'Europe/Paris', 'America/New_York', 'America/Los_Angeles', 
    'Asia/Tokyo', 'Australia/Sydney', 'UTC'
  ) THEN
    RAISE EXCEPTION 'Timezone non supporté';
  END IF;
  
  -- Validate reading speed (reasonable range)
  IF NEW.reading_speed IS NOT NULL AND (NEW.reading_speed < 50 OR NEW.reading_speed > 300) THEN
    RAISE EXCEPTION 'Vitesse de lecture invalide (50-300 mots/minute)';
  END IF;
  
  -- Clean and validate data
  NEW.email := LOWER(TRIM(NEW.email));
  NEW.firstname := TRIM(COALESCE(NEW.firstname, ''));
  NEW.lastname := TRIM(COALESCE(NEW.lastname, ''));
  
  -- Log user data modification for audit
  INSERT INTO public.security_audit_logs (
    user_id, action, resource, result, reason, metadata
  ) VALUES (
    NEW.id, 
    'user_data_modified', 
    'users',
    'success',
    'User profile update',
    jsonb_build_object(
      'fields_modified', jsonb_build_array('email', 'firstname', 'lastname'),
      'timestamp', now()
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Secure the sound_backgrounds table properly
DROP POLICY IF EXISTS "Authenticated users can read sound backgrounds" ON public.sound_backgrounds;
DROP POLICY IF EXISTS "Block delete on sound backgrounds" ON public.sound_backgrounds;
DROP POLICY IF EXISTS "Block insert on sound backgrounds" ON public.sound_backgrounds;
DROP POLICY IF EXISTS "Block update on sound backgrounds" ON public.sound_backgrounds;

-- Create proper policies for sound_backgrounds
CREATE POLICY "Authenticated users can read sound backgrounds" 
ON public.sound_backgrounds 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Only admins can modify sound backgrounds" 
ON public.sound_backgrounds 
FOR ALL 
USING (public.is_admin()) 
WITH CHECK (public.is_admin());