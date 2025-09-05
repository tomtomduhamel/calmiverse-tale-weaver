-- Phase 1: Corrections de sécurité critiques pour Calmi (version corrigée)

-- 1. Créer les nouvelles tables de sécurité

-- Table pour gérer les sessions sécurisées
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  session_token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_activity TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address INET,
  user_agent TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Activer RLS sur les sessions
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour les sessions utilisateur
CREATE POLICY "Users can view their own sessions" 
ON public.user_sessions 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own sessions" 
ON public.user_sessions 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own sessions" 
ON public.user_sessions 
FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own sessions" 
ON public.user_sessions 
FOR DELETE 
USING (user_id = auth.uid());

-- Table pour la gestion du rate limiting
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  ip_address INET,
  endpoint TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index pour optimiser les requêtes de rate limiting
CREATE INDEX IF NOT EXISTS idx_rate_limits_user_endpoint ON public.rate_limits(user_id, endpoint, window_start);
CREATE INDEX IF NOT EXISTS idx_rate_limits_ip_endpoint ON public.rate_limits(ip_address, endpoint, window_start);

-- Activer RLS sur rate_limits
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre l'insertion (nécessaire pour le rate limiting)
CREATE POLICY "Allow rate limit tracking" 
ON public.rate_limits 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- 2. Fonctions de sécurité

-- Fonction pour nettoyer les sessions expirées
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Supprimer les sessions expirées
  DELETE FROM public.user_sessions 
  WHERE expires_at < now() OR last_activity < now() - interval '30 days';
  
  -- Nettoyer les anciens rate limits (plus de 24h)
  DELETE FROM public.rate_limits 
  WHERE window_start < now() - interval '24 hours';
END;
$$;

-- Fonction pour valider les tentatives de connexion avec rate limiting
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_user_id UUID DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_endpoint TEXT DEFAULT 'general',
  p_max_requests INTEGER DEFAULT 100,
  p_window_minutes INTEGER DEFAULT 60
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_count INTEGER := 0;
  window_start_time TIMESTAMP WITH TIME ZONE;
BEGIN
  window_start_time := now() - (p_window_minutes || ' minutes')::interval;
  
  -- Compter les requêtes dans la fenêtre de temps
  IF p_user_id IS NOT NULL THEN
    SELECT COALESCE(SUM(request_count), 0) INTO current_count
    FROM public.rate_limits 
    WHERE user_id = p_user_id 
    AND endpoint = p_endpoint 
    AND window_start > window_start_time;
  ELSE
    SELECT COALESCE(SUM(request_count), 0) INTO current_count
    FROM public.rate_limits 
    WHERE ip_address = p_ip_address 
    AND endpoint = p_endpoint 
    AND window_start > window_start_time;
  END IF;
  
  -- Si limite dépassée, retourner false
  IF current_count >= p_max_requests THEN
    RETURN false;
  END IF;
  
  -- Enregistrer cette requête
  INSERT INTO public.rate_limits (user_id, ip_address, endpoint, window_start)
  VALUES (p_user_id, p_ip_address, p_endpoint, now())
  ON CONFLICT DO NOTHING;
  
  RETURN true;
END;
$$;

-- 3. Améliorer la sécurité des histoires avec validation
CREATE OR REPLACE FUNCTION public.validate_story_security()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Vérifier que l'utilisateur ne dépasse pas la limite d'histoires (50 par jour)
  IF (
    SELECT COUNT(*) 
    FROM public.stories 
    WHERE authorid = NEW.authorid 
    AND createdat > now() - interval '24 hours'
  ) > 50 THEN
    RAISE EXCEPTION 'Limite quotidienne d''histoires dépassée (50/jour)';
  END IF;
  
  -- Vérifier la taille du contenu (max 100KB)
  IF LENGTH(COALESCE(NEW.content, '')) > 100000 THEN
    RAISE EXCEPTION 'Contenu de l''histoire trop volumineux (max 100KB)';
  END IF;
  
  -- Nettoyer les données potentiellement dangereuses
  NEW.title := TRIM(COALESCE(NEW.title, ''));
  NEW.content := TRIM(COALESCE(NEW.content, ''));
  
  RETURN NEW;
END;
$$;

-- Trigger de validation sur les histoires
DROP TRIGGER IF EXISTS trigger_validate_story_security ON public.stories;
CREATE TRIGGER trigger_validate_story_security
  BEFORE INSERT OR UPDATE ON public.stories
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_story_security();

-- 4. Trigger pour nettoyer automatiquement les données
CREATE OR REPLACE FUNCTION public.auto_cleanup_security_data()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Nettoyer périodiquement (1% de chance à chaque insertion)
  IF random() < 0.01 THEN
    PERFORM public.cleanup_expired_sessions();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger sur les insertions d'histoires pour déclencher le nettoyage
DROP TRIGGER IF EXISTS trigger_auto_cleanup ON public.stories;
CREATE TRIGGER trigger_auto_cleanup
  AFTER INSERT ON public.stories
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_cleanup_security_data();

-- 5. Fonction pour vérifier l'intégrité des données utilisateur
CREATE OR REPLACE FUNCTION public.validate_user_data()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validation de l'email
  IF NEW.email IS NULL OR NEW.email = '' THEN
    RAISE EXCEPTION 'Email requis';
  END IF;
  
  -- Nettoyer les données
  NEW.email := LOWER(TRIM(NEW.email));
  NEW.firstname := TRIM(COALESCE(NEW.firstname, ''));
  NEW.lastname := TRIM(COALESCE(NEW.lastname, ''));
  
  RETURN NEW;
END;
$$;

-- Trigger de validation sur les utilisateurs
DROP TRIGGER IF EXISTS trigger_validate_user_data ON public.users;
CREATE TRIGGER trigger_validate_user_data
  BEFORE INSERT OR UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_user_data();