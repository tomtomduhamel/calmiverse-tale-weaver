-- Ajouter les colonnes pour le type d'animal de compagnie
ALTER TABLE public.children
ADD COLUMN pet_type text DEFAULT NULL,
ADD COLUMN pet_type_custom text DEFAULT NULL;

-- Ajouter une contrainte pour valider les valeurs de pet_type
ALTER TABLE public.children
ADD CONSTRAINT check_pet_type_values 
CHECK (pet_type IS NULL OR pet_type IN ('dog', 'cat', 'other'));