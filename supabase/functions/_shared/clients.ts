
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.5";
import { corsHeaders } from "./cors-config.ts";

// Configuration et initialisation d'OpenAI
export const initializeOpenAI = () => {
  const OPENAI_API_KEY = Deno.env.get('Calmi OpenAI');
    
  if (!OPENAI_API_KEY) {
    throw new Error("La clé API OpenAI n'est pas configurée sur le serveur (Calmi OpenAI)");
  }
  
  return OPENAI_API_KEY;
};

// Initialisation du client Supabase
export const initializeSupabase = () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Variables d'environnement Supabase manquantes");
  }
  
  return createClient(supabaseUrl, supabaseKey);
};
