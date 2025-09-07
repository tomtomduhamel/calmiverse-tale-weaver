-- Critical performance indexes for commercial publication
-- Index on stories table for main queries
CREATE INDEX IF NOT EXISTS idx_stories_author_status ON public.stories(authorid, status);
CREATE INDEX IF NOT EXISTS idx_stories_author_created ON public.stories(authorid, createdat DESC);
CREATE INDEX IF NOT EXISTS idx_stories_status_updated ON public.stories(status, updatedat DESC);
CREATE INDEX IF NOT EXISTS idx_stories_series ON public.stories(series_id, tome_number) WHERE series_id IS NOT NULL;

-- Index on children table
CREATE INDEX IF NOT EXISTS idx_children_author ON public.children(authorid, createdat DESC);

-- Index on audio_files for story lookups
CREATE INDEX IF NOT EXISTS idx_audio_files_story_status ON public.audio_files(story_id, status);

-- Index on story access logs for analytics
CREATE INDEX IF NOT EXISTS idx_story_access_logs_story_date ON public.story_access_logs(story_id, created_at DESC);

-- Index on user sessions for security
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_active ON public.user_sessions(user_id, is_active, expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_cleanup ON public.user_sessions(expires_at) WHERE is_active = true;

-- Index on rate_limits for performance
CREATE INDEX IF NOT EXISTS idx_rate_limits_user_endpoint ON public.rate_limits(user_id, endpoint, window_start DESC);
CREATE INDEX IF NOT EXISTS idx_rate_limits_ip_endpoint ON public.rate_limits(ip_address, endpoint, window_start DESC);
CREATE INDEX IF NOT EXISTS idx_rate_limits_cleanup ON public.rate_limits(window_start);

-- Compound index for story deduplication
CREATE INDEX IF NOT EXISTS idx_stories_deduplication ON public.stories(deduplication_key) WHERE deduplication_key IS NOT NULL;