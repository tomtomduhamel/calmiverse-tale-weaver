-- Phase 1: Système Beta Testeurs - Base de données complète

-- 1. Mettre à jour les limites Calmix
UPDATE public.subscription_limits 
SET audio_generations_per_month = 2 
WHERE tier = 'calmix';

-- 2. Créer la table beta_invitations
CREATE TABLE public.beta_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  tier subscription_tier NOT NULL DEFAULT 'calmix',
  duration_months integer NOT NULL DEFAULT 3,
  max_uses integer,
  current_uses integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone
);

-- Index pour recherche rapide par code
CREATE INDEX idx_beta_invitations_code ON public.beta_invitations(code);
CREATE INDEX idx_beta_invitations_active ON public.beta_invitations(is_active);

-- 3. Créer la table beta_users
CREATE TABLE public.beta_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  invitation_code text NOT NULL,
  status text NOT NULL DEFAULT 'pending_validation',
  requested_at timestamp with time zone NOT NULL DEFAULT now(),
  validated_at timestamp with time zone,
  validated_by uuid,
  subscription_expires_at timestamp with time zone,
  rejection_reason text,
  UNIQUE(user_id)
);

-- Index pour recherche rapide
CREATE INDEX idx_beta_users_status ON public.beta_users(status);
CREATE INDEX idx_beta_users_user_id ON public.beta_users(user_id);

-- 4. Activer RLS sur les tables
ALTER TABLE public.beta_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beta_users ENABLE ROW LEVEL SECURITY;

-- 5. Politiques RLS - Seuls les admins peuvent tout voir et modifier
CREATE POLICY "Admins can view beta invitations"
ON public.beta_invitations
FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can manage beta invitations"
ON public.beta_invitations
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can view beta users"
ON public.beta_users
FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can manage beta users"
ON public.beta_users
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Politique spéciale : Les utilisateurs peuvent s'inscrire (INSERT seulement)
CREATE POLICY "Users can register as beta"
ON public.beta_users
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 6. Fonction pour enregistrer une demande de beta testeur
CREATE OR REPLACE FUNCTION public.register_beta_request(
  p_user_id uuid,
  p_email text,
  p_code text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invitation RECORD;
  beta_user_id uuid;
BEGIN
  -- Vérifier que le code existe et est valide
  SELECT * INTO invitation
  FROM public.beta_invitations
  WHERE code = p_code
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > now())
    AND (max_uses IS NULL OR current_uses < max_uses);
  
  IF invitation IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Code d''invitation invalide ou expiré'
    );
  END IF;
  
  -- Vérifier que l'utilisateur n'a pas déjà fait une demande
  IF EXISTS (SELECT 1 FROM public.beta_users WHERE user_id = p_user_id) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Une demande existe déjà pour cet utilisateur'
    );
  END IF;
  
  -- Créer la demande de beta testeur
  INSERT INTO public.beta_users (
    user_id,
    email,
    invitation_code,
    status
  ) VALUES (
    p_user_id,
    p_email,
    p_code,
    'pending_validation'
  )
  RETURNING id INTO beta_user_id;
  
  -- Incrémenter le compteur d'utilisations
  UPDATE public.beta_invitations
  SET current_uses = current_uses + 1
  WHERE code = p_code;
  
  RETURN json_build_object(
    'success', true,
    'beta_user_id', beta_user_id,
    'status', 'pending_validation'
  );
END;
$$;

-- 7. Fonction pour valider un beta testeur
CREATE OR REPLACE FUNCTION public.validate_beta_user(
  p_beta_user_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  beta_user RECORD;
  invitation RECORD;
  subscription_end timestamp with time zone;
BEGIN
  -- Vérifier que l'utilisateur qui exécute est admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Seuls les administrateurs peuvent valider des beta testeurs';
  END IF;
  
  -- Récupérer le beta user
  SELECT * INTO beta_user
  FROM public.beta_users
  WHERE id = p_beta_user_id
    AND status = 'pending_validation';
  
  IF beta_user IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Beta testeur non trouvé ou déjà traité'
    );
  END IF;
  
  -- Récupérer l'invitation pour connaître la durée
  SELECT * INTO invitation
  FROM public.beta_invitations
  WHERE code = beta_user.invitation_code;
  
  -- Calculer la date d'expiration
  subscription_end := now() + (invitation.duration_months || ' months')::interval;
  
  -- Mettre à jour le beta_users
  UPDATE public.beta_users
  SET status = 'active',
      validated_at = now(),
      validated_by = auth.uid(),
      subscription_expires_at = subscription_end
  WHERE id = p_beta_user_id;
  
  -- Créer ou mettre à jour l'abonnement utilisateur
  INSERT INTO public.user_subscriptions (
    user_id,
    tier,
    status,
    current_period_start,
    current_period_end,
    stories_used_this_period,
    audio_generations_used_this_period
  ) VALUES (
    beta_user.user_id,
    invitation.tier,
    'active',
    now(),
    subscription_end,
    0,
    0
  )
  ON CONFLICT (user_id) DO UPDATE
  SET tier = invitation.tier,
      status = 'active',
      current_period_start = now(),
      current_period_end = subscription_end,
      stories_used_this_period = 0,
      audio_generations_used_this_period = 0,
      updated_at = now();
  
  RETURN json_build_object(
    'success', true,
    'user_id', beta_user.user_id,
    'tier', invitation.tier,
    'expires_at', subscription_end
  );
END;
$$;

-- 8. Fonction pour rejeter un beta testeur
CREATE OR REPLACE FUNCTION public.reject_beta_user(
  p_beta_user_id uuid,
  p_reason text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  beta_user RECORD;
BEGIN
  -- Vérifier que l'utilisateur qui exécute est admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Seuls les administrateurs peuvent rejeter des beta testeurs';
  END IF;
  
  -- Récupérer le beta user
  SELECT * INTO beta_user
  FROM public.beta_users
  WHERE id = p_beta_user_id
    AND status = 'pending_validation';
  
  IF beta_user IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Beta testeur non trouvé ou déjà traité'
    );
  END IF;
  
  -- Mettre à jour le statut
  UPDATE public.beta_users
  SET status = 'rejected',
      validated_at = now(),
      validated_by = auth.uid(),
      rejection_reason = p_reason
  WHERE id = p_beta_user_id;
  
  RETURN json_build_object(
    'success', true,
    'user_id', beta_user.user_id,
    'status', 'rejected'
  );
END;
$$;

-- 9. Fonction pour récupérer les beta testeurs en attente
CREATE OR REPLACE FUNCTION public.get_pending_beta_users()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  email text,
  invitation_code text,
  requested_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Vérifier que l'utilisateur qui exécute est admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Seuls les administrateurs peuvent consulter les beta testeurs';
  END IF;
  
  RETURN QUERY
  SELECT 
    bu.id,
    bu.user_id,
    bu.email,
    bu.invitation_code,
    bu.requested_at
  FROM public.beta_users bu
  WHERE bu.status = 'pending_validation'
  ORDER BY bu.requested_at DESC;
END;
$$;

-- 10. Permissions sur les fonctions
GRANT EXECUTE ON FUNCTION public.register_beta_request(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_beta_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_beta_user(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_pending_beta_users() TO authenticated;