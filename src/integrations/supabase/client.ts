
import { createClient } from "@supabase/supabase-js";

// Configuration sécurisée avec les vraies valeurs du projet
const supabaseUrl = "https://ioeihnoxvtpxtqhxklpw.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvZWlobm94dnRweHRxaHhrbHB3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU5ODQ1MzYsImV4cCI6MjA2MTU2MDUzNn0.5KolFPfnppqfb8lbYnWhJKo6GZL_VCxn3Zx1hxyLaro";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true, 
    detectSessionInUrl: true,
    storage: localStorage,
    storageKey: 'calmi-auth-token', // Clé unique pour éviter les conflits
    debug: import.meta.env.DEV, // Debug seulement en développement
    flowType: 'pkce', // PKCE pour une meilleure sécurité
  },
  global: {
    headers: {
      'X-Client-Info': 'calmiverse-web',
      'X-Requested-With': 'XMLHttpRequest'
    }
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Fonction de débogage sécurisée
export const checkAuthState = async () => {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (import.meta.env.DEV) {
      console.log("État de session actuel:", session?.user?.id || 'Aucune session');
      console.log("Utilisateur actuel:", user?.id || 'Aucun utilisateur');
    }
    
    return { 
      session, 
      user, 
      errors: { sessionError, userError }
    };
  } catch (error) {
    console.error("Erreur lors de la vérification de l'état d'authentification:", error);
    return { session: null, user: null, errors: { generalError: error } };
  }
};

// Écouteur sécurisé pour les changements d'authentification
supabase.auth.onAuthStateChange((event, session) => {
  if (import.meta.env.DEV) {
    console.log("Événement d'authentification:", event, session?.user?.id || 'Session fermée');
  }
  
  // Nettoyage en cas de déconnexion
  if (event === 'SIGNED_OUT') {
    localStorage.removeItem('calmi-auth-token');
    // Nettoyer d'autres données locales si nécessaire
  }
});

// Fonction de nettoyage sécurisée
export const secureSignOut = async () => {
  try {
    await supabase.auth.signOut();
    localStorage.clear(); // Nettoyer toutes les données locales
    sessionStorage.clear();
    return { success: true };
  } catch (error) {
    console.error("Erreur lors de la déconnexion sécurisée:", error);
    return { success: false, error };
  }
};
