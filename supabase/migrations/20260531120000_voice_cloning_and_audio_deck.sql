-- Migration: Add voice cloning structures and update subscription quotas
-- Date: 2026-05-31

-- 1. Create table for user voices
CREATE TABLE IF NOT EXISTS public.user_voices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  voice_ref_path TEXT NOT NULL, -- Path to .wav in storage
  transcript TEXT,              -- Text read during recording
  relation TEXT NOT NULL,       -- Relationship or label (e.g. Papa, Papy, etc.) - libre text as requested
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for user_voices
ALTER TABLE public.user_voices ENABLE ROW LEVEL SECURITY;

-- Create policies for user_voices
CREATE POLICY "Users can view their own voices" ON public.user_voices
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own voices" ON public.user_voices
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own voices" ON public.user_voices
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own voices" ON public.user_voices
  FOR DELETE USING (auth.uid() = user_id);

-- 2. Create table for voice invitations (grandparents distance recording link)
CREATE TABLE IF NOT EXISTS public.voice_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  relation_name TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  is_used BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'), -- Expires in 7 days as requested
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for voice_invitations
ALTER TABLE public.voice_invitations ENABLE ROW LEVEL SECURITY;

-- Policies for voice_invitations
CREATE POLICY "Users can manage their own invitations" ON public.voice_invitations
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view invitation details via token" ON public.voice_invitations
  FOR SELECT USING (true); -- Public read to allow grandparents link page to fetch invitation details without login

-- 3. Update subscription_limits with max_voice_clones column and new quotas
ALTER TABLE public.subscription_limits ADD COLUMN IF NOT EXISTS max_voice_clones INTEGER NOT NULL DEFAULT 0;

-- Update the plans quotas & limits as requested:
-- Calmidium: 10 audio gen/month, 1 voice clone, no community
UPDATE public.subscription_limits 
SET audio_generations_per_month = 10, max_voice_clones = 1, has_community_access = false
WHERE tier = 'calmidium';

-- Calmix: 20 audio gen/month, 2 voice clones, no community
UPDATE public.subscription_limits 
SET audio_generations_per_month = 20, max_voice_clones = 2, has_community_access = false
WHERE tier = 'calmix';

-- Calmixxl: 50 audio gen/month, 5 voice clones, no community
UPDATE public.subscription_limits 
SET audio_generations_per_month = 50, max_voice_clones = 5, has_community_access = false
WHERE tier = 'calmixxl';

-- Calmini: 0 audio gen/month, 0 voice clones, no community
UPDATE public.subscription_limits 
SET audio_generations_per_month = 0, max_voice_clones = 0, has_community_access = false
WHERE tier = 'calmini';

-- 4. Set up Supabase Storage policy for bucket 'voice-clones'
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'voice-clones', 
  'voice-clones', 
  false, -- private bucket for maximum security
  5242880, -- 5MB limit per voice reference
  ARRAY['audio/wav', 'audio/x-wav', 'audio/webm', 'audio/ogg', 'audio/mp3', 'audio/mpeg', 'audio/m4a']
)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for storage objects in voice-clones
CREATE POLICY "Allow authenticated users to upload voice references" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'voice-clones');

CREATE POLICY "Allow authenticated users to read their own voice references" ON storage.objects
  FOR SELECT USING (bucket_id = 'voice-clones');

CREATE POLICY "Allow authenticated users to delete their own voice references" ON storage.objects
  FOR DELETE USING (bucket_id = 'voice-clones');

-- Allow public uploads for invitations (grandparents distance recording link requires uploading without authentication)
CREATE POLICY "Allow public uploads for voice invitations" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'voice-clones');

CREATE POLICY "Allow public select for voice invitations objects" ON storage.objects
  FOR SELECT USING (bucket_id = 'voice-clones');
