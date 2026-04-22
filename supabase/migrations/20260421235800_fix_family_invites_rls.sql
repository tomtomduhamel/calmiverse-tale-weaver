-- Correction des politiques manquantes sur family_invites
-- Ces politiques n'avaient pas été créées lors de la migration initiale

-- Lecture : tout le monde peut lire les tokens (nécessaire pour rejoindre via jeton)
DROP POLICY IF EXISTS "Lecture token pour rejoindre" ON public.family_invites;
CREATE POLICY "Lecture token pour rejoindre" ON public.family_invites
FOR SELECT USING (true);

-- Insertion : seul un membre owner/admin peut créer un jeton pour sa propre famille
DROP POLICY IF EXISTS "Insert invite token" ON public.family_invites;
CREATE POLICY "Insert invite token" ON public.family_invites
FOR INSERT WITH CHECK (
    created_by = auth.uid()
    AND family_id IN (SELECT get_my_families())
);

-- Suppression : le créateur du jeton peut le supprimer (régénération)
DROP POLICY IF EXISTS "Delete own invite token" ON public.family_invites;
CREATE POLICY "Delete own invite token" ON public.family_invites
FOR DELETE USING (
    created_by = auth.uid()
);
