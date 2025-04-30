
import { createClient } from '@supabase/supabase-js';

// Utilisez ces valeurs temporaires pour le développement
// Vous devrez remplacer ces valeurs par vos propres clés Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://votre-projet.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'votre-clé-anon-supabase';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types pour les tables Supabase
export type Tables = {
  users: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    created_at: string;
  };
  children: {
    id: string;
    name: string;
    birthDate: string;
    authorId: string;
    interests: string[];
    gender: string;
    createdAt: string;
  };
  stories: {
    id: string;
    title: string;
    content: string;
    summary: string;
    preview: string;
    status: 'pending' | 'completed' | 'read' | 'error';
    childrenIds: string[];
    objective: string;
    authorId: string;
    createdAt: string;
    updatedAt: string;
  };
};

// Helper pour la gestion des erreurs
export const handleSupabaseError = (error: Error, message: string = 'Une erreur est survenue') => {
  console.error(`Erreur Supabase: ${message}`, error);
  return {
    error: true,
    message: message,
    details: error.message
  };
};

export default supabase;
