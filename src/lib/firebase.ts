
/**
 * Module d'adaptation Firebase -> Supabase
 * 
 * Ce fichier redirige les imports Firebase vers l'utilisation de Supabase
 * pour faciliter la migration progressive.
 */

import * as compatModule from './firebase-compat';
import { supabase } from './supabase';

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

// Faciliter la transition vers Supabase
export const getSupabase = () => supabase;

export default app;
