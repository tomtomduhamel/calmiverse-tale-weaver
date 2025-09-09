-- Activer l'extension pgcrypto pour les fonctions de hachage
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Vérifier que la fonction generate_deduplication_key fonctionne correctement
-- Elle utilise digest() et encode() qui nécessitent pgcrypto