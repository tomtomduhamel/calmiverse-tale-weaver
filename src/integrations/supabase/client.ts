
import { createClient } from "@supabase/supabase-js";

// Configuration avec les vraies valeurs du projet (corrigée)
const supabaseUrl = "https://ioeihnoxvtpxtqhxklpw.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvZWlobm94dnRweHRxaHhrbHB3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU5ODQ1MzYsImV4cCI6MjA2MTU2MDUzNn0.5KolFPfnppqfb8lbYnWhJKo6GZL_VCxn3Zx1hxyLaro";

// Validation stricte
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Configuration Supabase manquante");
}

// Configuration optimisée pour les Edge Functions
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true, 
    detectSessionInUrl: true,
    storage: localStorage,
    storageKey: 'calmi-auth-token',
    debug: import.meta.env.DEV,
    flowType: 'pkce',
  },
  global: {
    headers: {
      'X-Client-Info': 'calmiverse-web',
      'X-Requested-With': 'XMLHttpRequest'
    },
    // Configuration fetch optimisée pour les Edge Functions
    fetch: (url: string, options: any) => {
      console.log(`🌐 [Supabase] Fetch vers: ${url}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.error(`⏰ [Supabase] Timeout pour: ${url}`);
        controller.abort();
      }, 30000);
      
      return fetch(url, { 
        ...options, 
        signal: controller.signal,
        headers: {
          ...options.headers,
          'X-Requested-With': 'XMLHttpRequest',
          'Content-Type': 'application/json'
        }
      }).then(response => {
        clearTimeout(timeoutId);
        console.log(`📡 [Supabase] Réponse ${response.status} de: ${url}`);
        return response;
      }).catch(error => {
        clearTimeout(timeoutId);
        console.error(`❌ [Supabase] Erreur pour ${url}:`, error);
        throw error;
      });
    },
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Test de connectivité au démarrage
console.log(`🔧 [Supabase] Client initialisé avec URL: ${supabaseUrl}`);

// Export des valeurs pour diagnostic
export { supabaseUrl, supabaseAnonKey };
