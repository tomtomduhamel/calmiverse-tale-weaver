
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.5";
import { corsHeaders } from "./cors-config.ts";

// Configuration et initialisation de Lovable AI
export const initializeLovableAI = () => {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
  if (!LOVABLE_API_KEY) {
    throw new Error("La clé API Lovable AI n'est pas configurée sur le serveur");
  }
  
  return LOVABLE_API_KEY;
};

// DEPRECATED: Garder pour compatibilité temporaire
export const initializeOpenAI = initializeLovableAI;

// Initialisation du client Supabase
export const initializeSupabase = () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Variables d'environnement Supabase manquantes");
  }
  
  return createClient(supabaseUrl, supabaseKey);
};
