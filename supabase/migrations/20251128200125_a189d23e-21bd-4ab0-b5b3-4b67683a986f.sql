-- Créer une table pour tracker les tentatives d'inscription beta
CREATE TABLE IF NOT EXISTS public.beta_registration_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid, -- Pas de FK car l'utilisateur peut ne pas avoir confirmé son email
  email text NOT NULL,
  invitation_code text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone,
  error_message text
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_beta_registration_attempts_email ON public.beta_registration_attempts(email);
CREATE INDEX IF NOT EXISTS idx_beta_registration_attempts_user_id ON public.beta_registration_attempts(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_beta_registration_attempts_status ON public.beta_registration_attempts(status);

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_beta_registration_attempts_updated_at
  BEFORE UPDATE ON public.beta_registration_attempts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Enable RLS
ALTER TABLE public.beta_registration_attempts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own registration attempts"
  ON public.beta_registration_attempts
  FOR SELECT
  USING (
    auth.uid() = user_id 
    OR auth.email() = email
  );

CREATE POLICY "Users can insert their own registration attempts"
  ON public.beta_registration_attempts
  FOR INSERT
  WITH CHECK (
    auth.email() = email
  );

CREATE POLICY "Users can update their own registration attempts"
  ON public.beta_registration_attempts
  FOR UPDATE
  USING (
    auth.uid() = user_id 
    OR auth.email() = email
  );

CREATE POLICY "Admins can manage all registration attempts"
  ON public.beta_registration_attempts
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Fonction pour obtenir la dernière tentative d'un utilisateur
CREATE OR REPLACE FUNCTION public.get_user_beta_registration_attempt(p_user_id uuid)
RETURNS TABLE (
  id uuid,
  email text,
  invitation_code text,
  status text,
  created_at timestamp with time zone,
  completed_at timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, email, invitation_code, status, created_at, completed_at
  FROM public.beta_registration_attempts
  WHERE user_id = p_user_id
  ORDER BY created_at DESC
  LIMIT 1;
$$;