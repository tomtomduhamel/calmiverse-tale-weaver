-- First, update existing records to use valid gender values
UPDATE public.children 
SET gender = 'boy' 
WHERE gender IS NULL OR gender NOT IN ('boy', 'girl', 'pet');

-- Now make gender column NOT NULL with default
ALTER TABLE public.children 
ALTER COLUMN gender SET NOT NULL,
ALTER COLUMN gender SET DEFAULT 'boy'::text;

-- Add constraint to ensure gender has valid values
ALTER TABLE public.children 
ADD CONSTRAINT check_gender_values 
CHECK (gender IN ('boy', 'girl', 'pet'));

-- Add comment for documentation
COMMENT ON COLUMN public.children.gender IS 'Genre de l enfant: boy (garçon), girl (fille), pet (animal de compagnie)';