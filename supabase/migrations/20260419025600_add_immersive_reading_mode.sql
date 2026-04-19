ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS immersive_reading_mode text DEFAULT 'pulse';
