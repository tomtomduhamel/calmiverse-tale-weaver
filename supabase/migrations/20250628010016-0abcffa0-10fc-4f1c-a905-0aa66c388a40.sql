
-- Créer une table pour stocker les fichiers audio générés
CREATE TABLE public.audio_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID REFERENCES public.stories(id) ON DELETE CASCADE,
  text_content TEXT NOT NULL,
  audio_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, ready, error
  webhook_id TEXT, -- ID retourné par n8n pour tracking
  file_size INTEGER,
  duration INTEGER, -- durée en secondes
  voice_id TEXT DEFAULT '9BWtsMINqrJLrRacOk9x',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Activer RLS sur la table audio_files
ALTER TABLE public.audio_files ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre aux utilisateurs de voir leurs propres fichiers audio
CREATE POLICY "Users can view their own audio files" 
  ON public.audio_files 
  FOR SELECT 
  USING (
    story_id IN (
      SELECT id FROM public.stories WHERE authorid = auth.uid()
    )
  );

-- Politique pour permettre aux utilisateurs de créer des fichiers audio pour leurs histoires
CREATE POLICY "Users can create audio files for their stories" 
  ON public.audio_files 
  FOR INSERT 
  WITH CHECK (
    story_id IN (
      SELECT id FROM public.stories WHERE authorid = auth.uid()
    )
  );

-- Politique pour permettre aux utilisateurs de mettre à jour leurs fichiers audio
CREATE POLICY "Users can update their own audio files" 
  ON public.audio_files 
  FOR UPDATE 
  USING (
    story_id IN (
      SELECT id FROM public.stories WHERE authorid = auth.uid()
    )
  );

-- Créer un trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_audio_files_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_audio_files_updated_at_trigger
  BEFORE UPDATE ON public.audio_files
  FOR EACH ROW
  EXECUTE FUNCTION update_audio_files_updated_at();

-- Index pour améliorer les performances
CREATE INDEX idx_audio_files_story_id ON public.audio_files(story_id);
CREATE INDEX idx_audio_files_status ON public.audio_files(status);
