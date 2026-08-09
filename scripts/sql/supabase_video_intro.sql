-- Migration: Ajout du support de la vidéo d'introduction
-- À exécuter dans le "SQL Editor" du dashboard Supabase

-- 1. Ajout de la colonne 'video_path' à la table 'stories'
ALTER TABLE public.stories 
ADD COLUMN IF NOT EXISTS video_path text;

-- 2. Ajout de la préférence utilisateur 'video_intro_enabled' à la table 'users'
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS video_intro_enabled boolean DEFAULT true;

-- 3. Création du bucket 'storyvideos' s'il n'existe pas déjà
-- Note: 'insert into storage.buckets' peut échouer si le bucket existe déjà, d'où la gestion via DO
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'storyvideos') THEN 
    INSERT INTO storage.buckets (id, name, public) 
    VALUES ('storyvideos', 'storyvideos', true); 
  END IF; 
END $$;

-- 4. Politique de sécurité pour la lecture publique des vidéos
-- Permettre à tout le monde de lire les vidéos
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Public Access to storyvideos'
  ) THEN
    CREATE POLICY "Public Access to storyvideos" 
    ON storage.objects FOR SELECT 
    USING (bucket_id = 'storyvideos');
  END IF;
END $$;

-- NOTE: Pour que n8n puisse uploader les vidéos, assurez-vous d'utiliser 
-- la clé de service (service_role API key) ou de configurer une politique INSERT adéquate.
