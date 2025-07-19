
import { createClient } from "@supabase/supabase-js";

// Configuration avec les vraies valeurs du projet
const supabaseUrl = "https://ioeihnoxvtpxtqhxklpw.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvZWlobm94dnRweHRxaHhrbHB3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU5ODQ1MzYsImV4cCI6MjA2MTU2MDUzNn0.5KolFPfnppqfb8lbYnWhJKo6GZL_VCxn3Zx1hxyLaro";

// Validation stricte
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Configuration Supabase manquante");
}

// Configuration simplifiée et fonctionnelle
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: localStorage,
    storageKey: 'calmi-auth-token'
  },
  global: {
    headers: {
      'X-Client-Info': 'calmi-web',
      'apikey': supabaseAnonKey
    }
  }
});

// Test de connectivité au démarrage
console.log(`🔧 [Supabase] Client initialisé avec URL: ${supabaseUrl}`);

// Export des valeurs pour diagnostic
export { supabaseUrl, supabaseAnonKey };
