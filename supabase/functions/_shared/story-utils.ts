
// Fonctions utilitaires partagées pour la génération et la relance d'histoires
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.5";

// En-têtes CORS pour toutes les fonctions
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

// Génération de l'histoire avec OpenAI en utilisant fetch directement
export const generateStoryText = async (apiKey: string, objective: string, childrenNames: string[], isRetry = false) => {
  const retryText = isRetry ? "Ceci est une nouvelle tentative, alors essaie une approche différente." : "";
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Tu es un expert en création d'histoires pour enfants. 
          
FORMAT DE L'HISTOIRE :
- Longueur : 6000-10000 mots
- Structure narrative fluide et continue, sans découpage visible
- Pas de titre explicite

RÈGLES FONDAMENTALES :
- Adapte le langage à l'âge de l'enfant
- Crée des personnages mémorables et appropriés
- Utilise des dialogues engageants
- Ajoute des répétitions pour les jeunes enfants
- Évite tout contenu effrayant ou angoissant
- Termine toujours sur une note positive`
        },
        {
          role: 'user',
          content: `Je souhaite créer une histoire personnalisée pour ${childrenNames.join(', ')} avec l'objectif suivant : ${objective}. 
          L'histoire doit suivre la structure donnée tout en restant fluide et naturelle, sans découpage visible en parties.
          Assure-toi que l'histoire soit captivante dès le début pour maintenir l'attention des enfants.
          ${retryText}`
        }
      ],
      temperature: isRetry ? 0.8 : 0.7, // Légèrement plus de créativité pour les relances
      max_tokens: 3500,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('Erreur OpenAI:', errorData);
    throw new Error(`Erreur API OpenAI: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const storyText = data.choices[0].message?.content;
  
  if (!storyText) {
    throw new Error('Aucune histoire générée par OpenAI');
  }

  return storyText;
};

// Génération de résumé avec OpenAI
export const generateSummary = async (apiKey: string, storyText: string) => {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Tu es un assistant qui résume des histoires pour enfants de manière concise.'
        },
        {
          role: 'user',
          content: `Résume cette histoire en 3-4 phrases : ${storyText.substring(0, 2000)}...`
        }
      ],
      temperature: 0.5,
      max_tokens: 300,
    }),
  });

  if (!response.ok) {
    throw new Error(`Erreur API OpenAI (génération de résumé): ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message?.content || "Résumé non disponible";
};

// Génération de titre avec OpenAI
export const generateTitle = async (apiKey: string, storyText: string, childrenNames: string[]) => {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Tu es un assistant qui crée des titres captivants pour des histoires pour enfants.'
        },
        {
          role: 'user',
          content: `Crée un titre court et captivant pour cette histoire : ${storyText.substring(0, 1000)}...`
        }
      ],
      temperature: 0.8,
      max_tokens: 50,
    }),
  });

  if (!response.ok) {
    throw new Error(`Erreur API OpenAI (génération de titre): ${response.status}`);
  }

  const data = await response.json();
  const title = data.choices[0].message?.content?.replace(/["']/g, '') || `Histoire pour ${childrenNames.join(' et ')}`;
  return title;
};

// Mise à jour de l'histoire dans la base de données
export const updateStoryInDb = async (supabase, storyId: string, storyData: any) => {
  const { error } = await supabase
    .from('stories')
    .update({
      title: storyData.title,
      content: storyData.content,
      summary: storyData.summary,
      preview: storyData.preview,
      status: storyData.status,
      error: storyData.error,
      updatedat: new Date().toISOString()
    })
    .eq('id', storyId);

  if (error) {
    throw error;
  }
};

