-- Ajouter une politique RLS pour permettre l'accès public aux histoires partagées
-- Cette politique permet aux utilisateurs anonymes et authentifiés de lire une histoire
-- si elle est publiquement partagée et non expirée

CREATE POLICY "Accès public aux histoires partagées"
ON public.stories
FOR SELECT
TO anon, authenticated
USING (
  -- Vérifier que le partage public est activé
  (sharing->'publicAccess'->>'enabled')::boolean = true
  AND (
    -- Pas de date d'expiration OU date non dépassée
    (sharing->'publicAccess'->>'expiresAt') IS NULL
    OR (sharing->'publicAccess'->>'expiresAt')::timestamptz > NOW()
  )
);