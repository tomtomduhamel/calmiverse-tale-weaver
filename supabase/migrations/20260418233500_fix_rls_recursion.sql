-- Créer une fonction SECURITY DEFINER pour éviter la récursion infinie
CREATE OR REPLACE FUNCTION public.get_my_families()
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
STABLE
AS $$
  SELECT family_id FROM public.family_members WHERE user_id = auth.uid();
$$;

-- Nettoyer les anciennes politiques qui causaient la boucle infinie
DROP POLICY IF EXISTS "Lecture des membres si dans la famille" ON public.family_members;
DROP POLICY IF EXISTS "Seuls owner/admin ajoute des membres ou soi-même via token" ON public.family_members;
DROP POLICY IF EXISTS "Update rôle restreint à owner/admin" ON public.family_members;
DROP POLICY IF EXISTS "Delete seulement par owner/admin ou soi-même (leave)" ON public.family_members;

DROP POLICY IF EXISTS "Les membres peuvent voir leur famille" ON public.families;
DROP POLICY IF EXISTS "Les owners/admins peuvent modifier leur famille" ON public.families;
DROP POLICY IF EXISTS "Les utilisateurs peuvent se créer des familles" ON public.families;

DROP POLICY IF EXISTS "Accès collaboratif famille lecture children" ON public.children;
DROP POLICY IF EXISTS "Accès collaboratif famille update children" ON public.children;
DROP POLICY IF EXISTS "Accès collaboratif famille delete children" ON public.children;

DROP POLICY IF EXISTS "Accès collaboratif famille lecture stories" ON public.stories;
DROP POLICY IF EXISTS "Accès collaboratif famille update stories" ON public.stories;
DROP POLICY IF EXISTS "Accès collaboratif famille delete stories" ON public.stories;

-- Nouvelles politiques plus sûres et sans récursion (family_members)
CREATE POLICY "Lecture des membres si dans la famille" ON public.family_members 
FOR SELECT USING (
    family_id IN (SELECT get_my_families()) OR user_id = auth.uid()
);

CREATE POLICY "S_insert_family_members" ON public.family_members 
FOR INSERT WITH CHECK (
    family_id IN (SELECT get_my_families()) OR user_id = auth.uid()
);

CREATE POLICY "S_update_family_members" ON public.family_members 
FOR UPDATE USING (
    family_id IN (SELECT get_my_families())
);

CREATE POLICY "S_delete_family_members" ON public.family_members 
FOR DELETE USING (
    family_id IN (SELECT get_my_families()) OR user_id = auth.uid()
);

-- Politiques families
CREATE POLICY "Lecture de sa famille" ON public.families 
FOR SELECT USING (
    id IN (SELECT get_my_families())
);

CREATE POLICY "Update de sa famille" ON public.families 
FOR UPDATE USING (
    id IN (SELECT get_my_families())
);

CREATE POLICY "C_insert_fam" ON public.families 
FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Sécuriser children avec OR authorid (au cas où non migrés)
CREATE POLICY "Read children fam" ON public.children
FOR SELECT USING (
    family_id IN (SELECT get_my_families()) OR authorid = auth.uid()
);

CREATE POLICY "Update children fam" ON public.children
FOR UPDATE USING (
    family_id IN (SELECT get_my_families()) OR authorid = auth.uid()
);

CREATE POLICY "Delete children fam" ON public.children
FOR DELETE USING (
    family_id IN (SELECT get_my_families()) OR authorid = auth.uid()
);

-- Sécuriser stories avec OR authorid
CREATE POLICY "Read stories fam" ON public.stories
FOR SELECT USING (
    family_id IN (SELECT get_my_families()) OR authorid = auth.uid()
);

CREATE POLICY "Update stories fam" ON public.stories
FOR UPDATE USING (
    family_id IN (SELECT get_my_families()) OR authorid = auth.uid()
);

CREATE POLICY "Delete stories fam" ON public.stories
FOR DELETE USING (
    family_id IN (SELECT get_my_families()) OR authorid = auth.uid()
);
