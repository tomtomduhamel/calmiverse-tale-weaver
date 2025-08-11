-- Safe create enum type app_role if not exists
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
  END IF;
END $$;

-- user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- has_role and is_admin
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

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin');
$$;

-- RLS policies for user_roles
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

-- prompt_templates and versions
CREATE TABLE IF NOT EXISTS public.prompt_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  active_version_id UUID,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.prompt_template_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.prompt_templates(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  content TEXT NOT NULL,
  changelog TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(template_id, version)
);

-- updated_at trigger
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

-- Enable RLS for prompt tables
ALTER TABLE public.prompt_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_template_versions ENABLE ROW LEVEL SECURITY;

-- Policies: admin only
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

-- helper: next version
CREATE OR REPLACE FUNCTION public.next_template_version(p_template_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(MAX(version), 0) + 1 FROM public.prompt_template_versions WHERE template_id = p_template_id;
$$;

-- View of active templates
DROP VIEW IF EXISTS public.v_active_prompt_templates;
CREATE VIEW public.v_active_prompt_templates AS
SELECT t.*, v.content AS active_content, v.version AS active_version
FROM public.prompt_templates t
LEFT JOIN public.prompt_template_versions v ON v.id = t.active_version_id;