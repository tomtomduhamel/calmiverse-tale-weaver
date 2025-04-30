
/**
 * Module principal Firebase
 * 
 * Ce fichier expose les fonctionnalités Firebase pour l'application.
 * Une migration vers Supabase est en cours.
 */

import * as compatModule from './firebase-compat';

// Afficher un avertissement de migration
console.warn(
  "MIGRATION EN COURS: Firebase vers Supabase\n" +
  "Pour accélérer la migration, utilisez les hooks Supabase (useSupabaseAuth, useSupabaseChildren, useSupabaseStories)."
);

// Exporter les objets Firebase pour compatibilité
export const app = compatModule.default;
export const db = compatModule.db;
export const auth = compatModule.auth;
export const storage = compatModule.storage;
export const functions = compatModule.functions;

export default app;
