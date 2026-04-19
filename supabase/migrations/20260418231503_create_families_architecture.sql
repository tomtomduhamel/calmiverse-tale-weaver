-- 1. Création des tables Familles et Membres

CREATE TABLE IF NOT EXISTS public.families (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Indiquer à Supabase de tracker les modifications sur public.families si Realtime est activé
ALTER PUBLICATION supabase_realtime ADD TABLE public.families;

CREATE TABLE IF NOT EXISTS public.family_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(family_id, user_id)
);
ALTER PUBLICATION supabase_realtime ADD TABLE public.family_members;

CREATE TABLE IF NOT EXISTS public.family_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Ajout de family_id sur les tables existantes
ALTER TABLE public.children ADD COLUMN IF NOT EXISTS family_id UUID REFERENCES public.families(id) ON DELETE CASCADE;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS family_id UUID REFERENCES public.families(id) ON DELETE CASCADE;

-- 3. Migration des données existantes (Création d'une famille par utilisateur)
DO $$ 
DECLARE 
    r RECORD;
    v_family_id UUID;
    v_has_family BOOLEAN;
BEGIN
    FOR r IN (
        SELECT DISTINCT authorid 
        FROM public.children 
        WHERE authorid IS NOT NULL AND family_id IS NULL
        UNION 
        SELECT DISTINCT authorid 
        FROM public.stories 
        WHERE authorid IS NOT NULL AND family_id IS NULL
    ) LOOP
        -- Vérifier s'il n'a pas déjà une famille 'owner'
        v_has_family := EXISTS (
            SELECT 1 FROM public.family_members WHERE user_id = r.authorid AND role = 'owner'
        );

        IF NOT v_has_family THEN
            -- Créer famille
            INSERT INTO public.families (name, created_by)
            VALUES ('Ma Famille', r.authorid)
            RETURNING id INTO v_family_id;

            -- Ajouter comme membre propriétaire
            INSERT INTO public.family_members (family_id, user_id, role)
            VALUES (v_family_id, r.authorid, 'owner');
            
            -- Lier les enfants existants
            UPDATE public.children 
            SET family_id = v_family_id 
            WHERE authorid = r.authorid AND family_id IS NULL;

            -- Lier les histoires existantes
            UPDATE public.stories 
            SET family_id = v_family_id 
            WHERE authorid = r.authorid AND family_id IS NULL;
        ELSE
            -- S'il l'a déjà, on récupère son v_family_id
            v_family_id := (SELECT family_id FROM public.family_members WHERE user_id = r.authorid AND role = 'owner' LIMIT 1);
            
            -- Lier les enfants restants
            UPDATE public.children 
            SET family_id = v_family_id 
            WHERE authorid = r.authorid AND family_id IS NULL;

            -- Lier les histoires restantes
            UPDATE public.stories 
            SET family_id = v_family_id 
            WHERE authorid = r.authorid AND family_id IS NULL;
        END IF;
    END LOOP;
END $$;

-- 4. Sécurité RLS
-- Activer RLS pour les nouvelles tables
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_invites ENABLE ROW LEVEL SECURITY;

-- Politiques de sécurité: families
CREATE POLICY "Les membres peuvent voir leur famille" ON public.families 
FOR SELECT USING (
    id IN (SELECT family_id FROM public.family_members WHERE user_id = auth.uid())
);

CREATE POLICY "Les utilisateurs peuvent se créer des familles" ON public.families 
FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Les owners/admins peuvent modifier leur famille" ON public.families 
FOR UPDATE USING (
    id IN (SELECT family_id FROM public.family_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
);

-- Politiques de sécurité: family_members
CREATE POLICY "Lecture des membres si dans la famille" ON public.family_members 
FOR SELECT USING (
    family_id IN (SELECT family_id FROM public.family_members WHERE user_id = auth.uid())
    OR user_id = auth.uid()
);

CREATE POLICY "Seuls owner/admin ajoute des membres ou soi-même via token" ON public.family_members 
FOR INSERT WITH CHECK (
    family_id IN (SELECT family_id FROM public.family_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
    OR user_id = auth.uid()
);

CREATE POLICY "Update rôle restreint à owner/admin" ON public.family_members 
FOR UPDATE USING (
    family_id IN (SELECT family_id FROM public.family_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
);

CREATE POLICY "Delete seulement par owner/admin ou soi-même (leave)" ON public.family_members 
FOR DELETE USING (
    family_id IN (SELECT family_id FROM public.family_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
    OR user_id = auth.uid()
);

-- 5. Ajout de politiques permissives sur children et stories
CREATE POLICY "Accès collaboratif famille lecture children" ON public.children
FOR SELECT USING (
    family_id IN (SELECT family_id FROM public.family_members WHERE user_id = auth.uid())
);

CREATE POLICY "Accès collaboratif famille update children" ON public.children
FOR UPDATE USING (
    family_id IN (SELECT family_id FROM public.family_members WHERE user_id = auth.uid())
);

CREATE POLICY "Accès collaboratif famille delete children" ON public.children
FOR DELETE USING (
    family_id IN (SELECT family_id FROM public.family_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
    OR authorid = auth.uid()
);

CREATE POLICY "Accès collaboratif famille lecture stories" ON public.stories
FOR SELECT USING (
    family_id IN (SELECT family_id FROM public.family_members WHERE user_id = auth.uid())
);

CREATE POLICY "Accès collaboratif famille update stories" ON public.stories
FOR UPDATE USING (
    family_id IN (SELECT family_id FROM public.family_members WHERE user_id = auth.uid())
);

CREATE POLICY "Accès collaboratif famille delete stories" ON public.stories
FOR DELETE USING (
    family_id IN (SELECT family_id FROM public.family_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
    OR authorid = auth.uid()
);

-- 6. Mise à jour de get_stories_count_by_children pour inclure les Familles
CREATE OR REPLACE FUNCTION public.get_stories_count_by_children(p_user_id uuid)
RETURNS TABLE (
  child_id text,
  story_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    unnest(s.childrenids) as child_id,
    COUNT(*) as story_count
  FROM public.stories s
  WHERE s.authorid = p_user_id OR s.family_id IN (SELECT family_id FROM public.family_members WHERE user_id = p_user_id)
  GROUP BY unnest(s.childrenids);
END;
$$;

-- 7. Trigger de création automatique de Famille à l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user_family() 
RETURNS TRIGGER AS $$
DECLARE
  v_family_id UUID;
BEGIN
  -- Création de la famille
  INSERT INTO public.families (name, created_by)
  VALUES ('Ma Famille', NEW.id)
  RETURNING id INTO v_family_id;

  -- Ajout du propriétaire
  INSERT INTO public.family_members (family_id, user_id, role)
  VALUES (v_family_id, NEW.id, 'owner');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_for_family ON auth.users;

CREATE TRIGGER on_auth_user_created_for_family
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_family();

-- 8. Fonction RPC pour rejoindre une famille via un jeton
CREATE OR REPLACE FUNCTION public.join_family(p_token text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_family_id UUID;
  v_invite_id UUID;
  v_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Trouver l'invitation
  v_invite_id := (SELECT id FROM public.family_invites WHERE token = p_token LIMIT 1);
  v_family_id := (SELECT family_id FROM public.family_invites WHERE token = p_token LIMIT 1);
  v_expires_at := (SELECT expires_at FROM public.family_invites WHERE token = p_token LIMIT 1);

  IF v_invite_id IS NULL THEN
    RAISE EXCEPTION 'Jeton invalide ou introuvable.';
  END IF;

  IF v_expires_at IS NOT NULL AND v_expires_at < NOW() THEN
    RAISE EXCEPTION 'Ce jeton a expiré.';
  END IF;

  -- Insérer l'utilisateur dans la famille
  INSERT INTO public.family_members (family_id, user_id, role)
  VALUES (v_family_id, auth.uid(), 'member')
  ON CONFLICT (family_id, user_id) DO NOTHING;

  RETURN TRUE;
END;
$$;
