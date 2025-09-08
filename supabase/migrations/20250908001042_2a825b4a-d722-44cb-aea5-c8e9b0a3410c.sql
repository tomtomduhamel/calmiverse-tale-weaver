-- Phase 2: Advanced security and rate limiting enhancements
-- Global rate limiting improvements

-- Enhanced rate limits table with more granular control
ALTER TABLE public.rate_limits 
ADD COLUMN IF NOT EXISTS action_type TEXT DEFAULT 'general',
ADD COLUMN IF NOT EXISTS severity TEXT DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS user_agent TEXT,
ADD COLUMN IF NOT EXISTS blocked_until TIMESTAMP WITH TIME ZONE;

-- Create index for faster rate limit lookups
CREATE INDEX IF NOT EXISTS idx_rate_limits_user_action ON public.rate_limits(user_id, action_type, window_start DESC);
CREATE INDEX IF NOT EXISTS idx_rate_limits_ip_action ON public.rate_limits(ip_address, action_type, window_start DESC);
CREATE INDEX IF NOT EXISTS idx_rate_limits_blocked ON public.rate_limits(blocked_until) WHERE blocked_until IS NOT NULL;

-- Enhanced rate limiting function with different tiers
CREATE OR REPLACE FUNCTION public.check_enhanced_rate_limit(
  p_user_id UUID DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_action_type TEXT DEFAULT 'general',
  p_max_requests INTEGER DEFAULT 100,
  p_window_minutes INTEGER DEFAULT 60,
  p_severity TEXT DEFAULT 'normal'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_count INTEGER := 0;
  window_start_time TIMESTAMP WITH TIME ZONE;
  is_blocked BOOLEAN := FALSE;
  remaining_requests INTEGER;
  reset_time TIMESTAMP WITH TIME ZONE;
  result JSON;
BEGIN
  window_start_time := now() - (p_window_minutes || ' minutes')::interval;
  
  -- Check if user/IP is currently blocked
  IF p_user_id IS NOT NULL THEN
    SELECT blocked_until > now() INTO is_blocked
    FROM public.rate_limits 
    WHERE user_id = p_user_id 
    AND action_type = p_action_type 
    AND blocked_until IS NOT NULL
    ORDER BY blocked_until DESC
    LIMIT 1;
  ELSE
    SELECT blocked_until > now() INTO is_blocked
    FROM public.rate_limits 
    WHERE ip_address = p_ip_address 
    AND action_type = p_action_type 
    AND blocked_until IS NOT NULL
    ORDER BY blocked_until DESC
    LIMIT 1;
  END IF;
  
  IF is_blocked THEN
    SELECT json_build_object(
      'allowed', false,
      'reason', 'blocked',
      'reset_time', blocked_until,
      'remaining', 0
    ) INTO result
    FROM public.rate_limits 
    WHERE (user_id = p_user_id OR ip_address = p_ip_address)
    AND action_type = p_action_type 
    AND blocked_until > now()
    ORDER BY blocked_until DESC
    LIMIT 1;
    
    RETURN result;
  END IF;
  
  -- Count requests in current window
  IF p_user_id IS NOT NULL THEN
    SELECT COALESCE(SUM(request_count), 0) INTO current_count
    FROM public.rate_limits 
    WHERE user_id = p_user_id 
    AND action_type = p_action_type 
    AND window_start > window_start_time;
  ELSE
    SELECT COALESCE(SUM(request_count), 0) INTO current_count
    FROM public.rate_limits 
    WHERE ip_address = p_ip_address 
    AND action_type = p_action_type 
    AND window_start > window_start_time;
  END IF;
  
  remaining_requests := p_max_requests - current_count;
  reset_time := now() + (p_window_minutes || ' minutes')::interval;
  
  -- If limit exceeded
  IF current_count >= p_max_requests THEN
    -- For severe violations, implement progressive blocking
    IF p_severity = 'high' THEN
      INSERT INTO public.rate_limits (
        user_id, ip_address, action_type, severity, 
        blocked_until, window_start, request_count
      ) VALUES (
        p_user_id, p_ip_address, p_action_type, p_severity,
        now() + INTERVAL '15 minutes', now(), 1
      );
    END IF;
    
    RETURN json_build_object(
      'allowed', false,
      'reason', 'rate_limit_exceeded',
      'reset_time', reset_time,
      'remaining', 0,
      'limit', p_max_requests,
      'window_minutes', p_window_minutes
    );
  END IF;
  
  -- Record this request
  INSERT INTO public.rate_limits (
    user_id, ip_address, action_type, severity, 
    window_start, request_count
  ) VALUES (
    p_user_id, p_ip_address, p_action_type, p_severity, 
    now(), 1
  ) ON CONFLICT DO NOTHING;
  
  RETURN json_build_object(
    'allowed', true,
    'remaining', remaining_requests - 1,
    'reset_time', reset_time,
    'limit', p_max_requests,
    'window_minutes', p_window_minutes
  );
END;
$$;

-- Create security audit log table
CREATE TABLE IF NOT EXISTS public.security_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  ip_address INET,
  action TEXT NOT NULL,
  resource TEXT,
  result TEXT NOT NULL, -- 'allowed', 'denied', 'blocked'
  reason TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on audit logs
ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view security audit logs" 
ON public.security_audit_logs 
FOR SELECT 
USING (public.is_admin());

-- Allow system to insert audit logs
CREATE POLICY "System can insert audit logs" 
ON public.security_audit_logs 
FOR INSERT 
WITH CHECK (true);

-- Index for audit log queries
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_user_action ON public.security_audit_logs(user_id, action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_ip_action ON public.security_audit_logs(ip_address, action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_result ON public.security_audit_logs(result, created_at DESC);

-- Function to log security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_user_id UUID DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_action TEXT DEFAULT NULL,
  p_resource TEXT DEFAULT NULL,
  p_result TEXT DEFAULT 'allowed',
  p_reason TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.security_audit_logs (
    user_id, ip_address, action, resource, result, reason, metadata
  ) VALUES (
    p_user_id, p_ip_address, p_action, p_resource, p_result, p_reason, p_metadata
  );
END;
$$;