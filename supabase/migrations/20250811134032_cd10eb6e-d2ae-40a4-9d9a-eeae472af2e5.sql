-- 1) Enum des rôles et table user_roles
CREATE TYPE IF NOT EXISTS public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Fonction sécurisée pour vérifier un rôle
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- Raccourci administrateur
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin');
$$;

-- Politiques RLS sur user_roles: seuls les admins peuvent lire et modifier
DROP POLICY IF EXISTS "Admins can select user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete user_roles" ON public.user_roles;

CREATE POLICY "Admins can select user_roles"
ON public.user_roles FOR SELECT
USING (public.is_admin());

CREATE POLICY "Admins can insert user_roles"
ON public.user_roles FOR INSERT
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update user_roles"
ON public.user_roles FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete user_roles"
ON public.user_roles FOR DELETE
USING (public.is_admin());

-- 2) Tables de prompts avec versioning
CREATE TABLE IF NOT EXISTS public.prompt_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,          -- ex: 'story_generation_v1'
  title TEXT NOT NULL,               -- label lisible
  description TEXT,                  -- aide
  active_version_id UUID,            -- référence version active
  created_by UUID NOT NULL,          -- créateur
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.prompt_template_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.prompt_templates(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,          -- incrément
  content TEXT NOT NULL,             -- texte du prompt (peut contenir des variables)
  changelog TEXT,                    -- note de version
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(template_id, version)
);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prompt_templates_updated_at ON public.prompt_templates;
CREATE TRIGGER trg_prompt_templates_updated_at
BEFORE UPDATE ON public.prompt_templates
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Trigger: assurer une seule version active via active_version_id
-- (la contrainte d'unicité est portée par le fait qu'on référence une seule version sur le template)

-- RLS: accès Admin uniquement
ALTER TABLE public.prompt_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_template_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can select templates" ON public.prompt_templates;
DROP POLICY IF EXISTS "Admins can modify templates" ON public.prompt_templates;
DROP POLICY IF EXISTS "Admins can select template versions" ON public.prompt_template_versions;
DROP POLICY IF EXISTS "Admins can modify template versions" ON public.prompt_template_versions;

CREATE POLICY "Admins can select templates"
ON public.prompt_templates FOR SELECT
USING (public.is_admin());

CREATE POLICY "Admins can modify templates"
ON public.prompt_templates FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can select template versions"
ON public.prompt_template_versions FOR SELECT
USING (public.is_admin());

CREATE POLICY "Admins can modify template versions"
ON public.prompt_template_versions FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 3) Helpers: obtenir la prochaine version
CREATE OR REPLACE FUNCTION public.next_template_version(p_template_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(MAX(version), 0) + 1 FROM public.prompt_template_versions WHERE template_id = p_template_id;
$$;

-- 4) Optionnel: vue simplifiée de la version active
CREATE OR REPLACE VIEW public.v_active_prompt_templates AS
SELECT t.*, v.content AS active_content, v.version AS active_version
FROM public.prompt_templates t
LEFT JOIN public.prompt_template_versions v ON v.id = t.active_version_id;

-- Protéger la vue (lecture admin uniquement)
DROP POLICY IF EXISTS "Admins can select v_active_prompt_templates" ON public.v_active_prompt_templates;
-- RLS ne s'applique pas aux vues; on s'appuie sur les politiques des tables sous-jacentes.
-- Rien à faire ici.
