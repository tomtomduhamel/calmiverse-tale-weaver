
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.5";
import { Configuration, OpenAIApi } from "https://esm.sh/openai@3.2.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Gérer les requêtes CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Récupérer les données de la requête
    const { storyId, objective, childrenNames } = await req.json();

    if (!storyId || !objective || !childrenNames) {
      console.error("Paramètres manquants:", { storyId, objective, childrenNames });
      throw new Error("Paramètres manquants: storyId, objective, et childrenNames sont requis");
    }

    console.log("Génération d'histoire pour:", { storyId, objective, childrenNames });

    // Récupérer la clé API OpenAI depuis les secrets Supabase
    const OPENAI_API_KEY = Deno.env.get('Calmi OpenAI');
    
    if (!OPENAI_API_KEY) {
      console.error('Clé API OpenAI manquante');
      throw new Error('La clé API OpenAI n\'est pas configurée sur le serveur (Calmi OpenAI)');
    }
    
    // Configuration OpenAI
    const configuration = new Configuration({ apiKey: OPENAI_API_KEY });
    const openai = new OpenAIApi(configuration);
    
    // Générer l'histoire avec OpenAI
    const completion = await openai.createChatCompletion({
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
          Assure-toi que l'histoire soit captivante dès le début pour maintenir l'attention des enfants.`
        }
      ],
      temperature: 0.7,
      max_tokens: 3500,
    });

    const storyText = completion.data.choices[0].message?.content;
    
    if (!storyText) {
      throw new Error('Aucune histoire générée par OpenAI');
    }

    // Générer un résumé
    const summaryCompletion = await openai.createChatCompletion({
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
    });

    const summary = summaryCompletion.data.choices[0].message?.content || "Résumé non disponible";

    // Générer un titre
    const titleCompletion = await openai.createChatCompletion({
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
    });

    const title = titleCompletion.data.choices[0].message?.content?.replace(/["']/g, '') || `L'aventure de ${childrenNames.join(' et ')}`;

    // Créer un client Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error("Variables d'environnement Supabase manquantes");
      throw new Error("Configuration Supabase manquante");
    }
    
    console.log("Connexion à Supabase pour mettre à jour l'histoire");
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Mettre à jour l'histoire dans la base de données
    const { error } = await supabase
      .from('stories')
      .update({
        title,
        content: storyText,
        summary: summary,
        preview: storyText.substring(0, 200) + "...",
        status: 'completed',
        updatedat: new Date().toISOString()
      })
      .eq('id', storyId);

    if (error) {
      console.error("Erreur lors de la mise à jour de l'histoire:", error);
      throw error;
    }

    console.log("Histoire générée avec succès:", { storyId, title });
    
    return new Response(
      JSON.stringify({
        success: true,
        storyData: {
          title,
          story_text: storyText,
          story_summary: summary,
          preview: storyText.substring(0, 200) + "..."
        }
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error: any) {
    console.error("Erreur:", error);

    // En cas d'erreur, essayez de mettre à jour le statut de l'histoire
    try {
      const { storyId } = await req.json();
      
      if (storyId) {
        const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
        const supabase = createClient(supabaseUrl, supabaseKey);

        console.log("Mise à jour du statut d'erreur pour l'histoire:", storyId);
        await supabase
          .from('stories')
          .update({
            status: 'error',
            error: error.message || 'Erreur inconnue',
            updatedat: new Date().toISOString()
          })
          .eq('id', storyId);
      }
    } catch (e) {
      console.error("Erreur lors de la mise à jour du statut d'erreur:", e);
    }

    return new Response(
      JSON.stringify({
        error: error.message || "Une erreur est survenue"
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});
