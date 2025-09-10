-- Fix remaining security linter warnings

-- 1. Fix Function Search Path Mutable warnings by setting search_path
CREATE OR REPLACE FUNCTION public.validate_role_assignment()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.audit_role_changes()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.validate_user_data()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;