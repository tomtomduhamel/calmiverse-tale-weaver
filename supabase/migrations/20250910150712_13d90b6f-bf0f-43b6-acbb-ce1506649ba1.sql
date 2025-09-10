-- Fix critical digest() function error in generate_deduplication_key
-- The function was failing because digest() is in extensions schema but search_path was set to public

CREATE OR REPLACE FUNCTION public.generate_deduplication_key(p_title text, p_authorid uuid, p_objective text DEFAULT NULL::text, p_children_names text[] DEFAULT NULL::text[])
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Use explicit schema reference for digest function
  RETURN encode(
    extensions.digest(
      COALESCE(p_title, '') || '|' || 
      COALESCE(p_authorid::text, '') || '|' || 
      COALESCE(p_objective, '') || '|' || 
      COALESCE(array_to_string(p_children_names, ','), ''), 
      'sha256'::text
    ), 
    'hex'
  );
END;
$$;