ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS dim_screen_on_audio boolean DEFAULT false;
