
import { createClient } from '@supabase/supabase-js';

// Utiliser les variables d'environnement pour les clés Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Vérifier que les variables d'environnement sont définies
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "❌ Variables d'environnement Supabase manquantes. " +
    "Assurez-vous d'avoir défini VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans votre fichier .env"
  );
}

// Options pour le client Supabase avec realtime activé
const supabaseOptions = {
  realtime: {
    // Options pour la fonctionnalité Realtime
    params: {
      eventsPerSecond: 10
    }
  },
  db: {
    schema: 'public',
  },
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    // Nombre de tentatives de reconnexion
    fetch: (url: string, options: any) => fetch(url, { ...options, retry: 3 }),
  }
};

export const supabase = createClient(
  supabaseUrl || 'https://exemple.supabase.co', 
  supabaseAnonKey || 'exemple-clé-publique',
  supabaseOptions
);

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
    childrenNames: string[];
    objective: string;
    authorId: string;
    createdAt: string;
    updatedAt: string;
    error?: string;
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
