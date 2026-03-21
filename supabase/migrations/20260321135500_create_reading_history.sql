-- Migration: Create reading_history table
CREATE TABLE IF NOT EXISTS public.reading_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed BOOLEAN DEFAULT TRUE,
    UNIQUE(user_id, story_id, read_at)
);

-- Enable RLS
ALTER TABLE public.reading_history ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own reading history"
    ON public.reading_history FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reading history"
    ON public.reading_history FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Optional: Index to speed up queries by user
CREATE INDEX IF NOT EXISTS reading_history_user_id_idx ON public.reading_history(user_id);
-- Optional: Index to speed up queries by story
CREATE INDEX IF NOT EXISTS reading_history_story_id_idx ON public.reading_history(story_id);
