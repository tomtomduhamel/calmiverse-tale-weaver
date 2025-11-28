-- Ajouter contrainte UNIQUE sur user_subscriptions.user_id si elle n'existe pas déjà
-- Cela permet le ON CONFLICT dans validate_beta_user

DO $$ 
BEGIN
  -- Vérifier si la contrainte existe déjà
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_subscriptions_user_id_key'
  ) THEN
    -- Ajouter la contrainte UNIQUE
    ALTER TABLE public.user_subscriptions 
    ADD CONSTRAINT user_subscriptions_user_id_key UNIQUE (user_id);
    
    RAISE NOTICE 'Contrainte UNIQUE ajoutée sur user_subscriptions.user_id';
  ELSE
    RAISE NOTICE 'Contrainte UNIQUE existe déjà sur user_subscriptions.user_id';
  END IF;
END $$;

-- La fonction validate_beta_user existe déjà et crée correctement l'entrée dans user_subscriptions
-- Pas besoin de la modifier car elle contient déjà la logique ON CONFLICT (user_id)