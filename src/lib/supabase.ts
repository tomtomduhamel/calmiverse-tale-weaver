
import { createClient } from '@supabase/supabase-js';
import type { AuthFlowType } from '@supabase/supabase-js';

// Configuration Supabase sécurisée
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validation stricte des variables d'environnement
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "❌ Variables d'environnement Supabase manquantes. " +
    "Assurez-vous d'avoir défini VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans votre fichier .env"
  );
  throw new Error("Configuration Supabase invalide");
}

// Validation de l'URL Supabase
try {
  new URL(supabaseUrl);
} catch {
  console.error("❌ VITE_SUPABASE_URL n'est pas une URL valide");
  throw new Error("URL Supabase invalide");
}

// Options sécurisées pour le client Supabase
const supabaseOptions = {
  realtime: {
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
    detectSessionInUrl: true,
    storage: localStorage,
    storageKey: 'calmi-auth-token',
    flowType: 'pkce' as AuthFlowType // Utilise le type correct avec assertion
  },
  global: {
    headers: {
      'X-Client-Info': 'calmiverse-web'
    },
    // Fetch avec retry et timeout sécurisé
    fetch: (url: string, options: any) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
      
      return fetch(url, { 
        ...options, 
        signal: controller.signal,
        // Sécurité headers
        headers: {
          ...options.headers,
          'X-Requested-With': 'XMLHttpRequest'
        }
      }).finally(() => clearTimeout(timeoutId));
    },
  }
};

export const supabase = createClient(
  supabaseUrl, 
  supabaseAnonKey,
  supabaseOptions
);

// Types sécurisés pour les tables Supabase
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

// Helper sécurisé pour la gestion des erreurs
export const handleSupabaseError = (error: Error, message: string = 'Une erreur est survenue') => {
  // Ne pas exposer les détails sensibles en production
  const isDevelopment = import.meta.env.DEV;
  
  console.error(`Erreur Supabase: ${message}`, isDevelopment ? error : error.message);
  
  return {
    error: true,
    message: message,
    details: isDevelopment ? error.message : undefined
  };
};

// Fonction de vérification de santé améliorée
export const checkRealtimeConfig = async () => {
  try {
    const channel = supabase.channel('healthcheck');
    let channelStatus = 'UNKNOWN';
    
    // Timeout pour éviter les connexions infinies
    const timeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout de connexion Realtime')), 10000)
    );
    
    const connectionPromise = new Promise<string>((resolve) => {
      channel.subscribe((status: string) => {
        console.log('Statut de la connexion Realtime:', status);
        channelStatus = status;
        resolve(status);
      });
    });
    
    await Promise.race([connectionPromise, timeout]);
    
    // Nettoyage après vérification
    setTimeout(() => supabase.removeChannel(channel), 5000);
    
    return { 
      status: channelStatus, 
      working: channelStatus === 'SUBSCRIBED',
      channel
    };
  } catch (error) {
    console.error('Erreur lors de la vérification Realtime:', error);
    return { status: 'ERROR', working: false, error };
  }
};

// Fonction de validation de session sécurisée
export const validateSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Erreur de validation de session:', error);
      return { valid: false, error };
    }
    
    if (!session) {
      return { valid: false, error: null };
    }
    
    // Vérifier si le token n'est pas expiré
    const now = Math.floor(Date.now() / 1000);
    if (session.expires_at && session.expires_at < now) {
      console.warn('Session expirée');
      return { valid: false, error: new Error('Session expirée') };
    }
    
    return { valid: true, session };
  } catch (error) {
    console.error('Erreur lors de la validation de session:', error);
    return { valid: false, error };
  }
};

export default supabase;
