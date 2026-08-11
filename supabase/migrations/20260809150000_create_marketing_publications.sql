-- Migration: Create marketing_publications table for Instagram automated publishing
-- Date: 2026-08-09

CREATE TABLE IF NOT EXISTS public.marketing_publications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slot TEXT NOT NULL CHECK (slot IN ('morning_6h', 'noon_12h', 'evening_19h')),
  target_date DATE NOT NULL DEFAULT CURRENT_DATE,
  channel TEXT NOT NULL DEFAULT 'instagram',
  publication_type TEXT NOT NULL DEFAULT 'story' CHECK (publication_type IN ('story', 'reel', 'story_and_reel')),
  target_duration_minutes INTEGER NOT NULL DEFAULT 3,
  theme TEXT NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  full_content TEXT,
  image_prompt TEXT,
  image_url TEXT,
  sound_id UUID REFERENCES public.sound_backgrounds(id) ON DELETE SET NULL,
  sound_url TEXT,
  video_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'ready', 'published', 'failed')),
  ig_story_media_id TEXT,
  ig_reel_media_id TEXT,
  ig_container_id TEXT,
  error_message TEXT,
  cta_keyword TEXT NOT NULL DEFAULT 'CALMI',
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for fast lookup by date and slot
CREATE INDEX IF NOT EXISTS idx_marketing_publications_date_slot 
  ON public.marketing_publications (target_date, slot);

CREATE INDEX IF NOT EXISTS idx_marketing_publications_status 
  ON public.marketing_publications (status);

-- Enable RLS
ALTER TABLE public.marketing_publications ENABLE ROW LEVEL SECURITY;

-- Allow public/authenticated/service role read/write as configured
CREATE POLICY "Allow authenticated and service role full access" 
  ON public.marketing_publications 
  FOR ALL 
  USING (true)
  WITH CHECK (true);
