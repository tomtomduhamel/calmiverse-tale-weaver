
/**
 * @deprecated Ce fichier est maintenu pour la compatibilité. 
 * Utilisez plutôt les modules dans src/utils/migration/
 */

// Ré-exporter les fonctions depuis les nouveaux modules pour maintenir la compatibilité
export { migrateFirebaseUser, migrateUserData } from './migration/firebase-to-supabase';
