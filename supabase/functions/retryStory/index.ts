
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { Configuration, OpenAIApi } from 'https://esm.sh/openai@3.2.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Gérer les requêtes OPTIONS (CORS preflight)
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Récupérer la clé API OpenAI depuis les secrets Supabase
    const OPENAI_API_KEY = Deno.env.get('Calmi OpenAI');
    
    if (!OPENAI_API_KEY) {
      console.error('Clé API OpenAI manquante');
      return new Response(
        JSON.stringify({ error: 'Configuration OpenAI manquante sur le serveur' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Obtenir les données de la requête
    const { storyId } = await req.json();
    
    if (!storyId) {
      return new Response(
        JSON.stringify({ error: 'Paramètres manquants ou invalides' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Accéder à Supabase pour récupérer l'histoire
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Récupérer l'histoire existante
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .select('*')
      .eq('id', storyId)
      .single();
      
    if (storyError || !story) {
      throw new Error('Histoire non trouvée');
    }
    
    const { objective, childrennames: childrenNames } = story;

    console.log('Nouvelle tentative de génération pour:', { storyId, objective, childrenNames });

    // Configuration OpenAI
    const configuration = new Configuration({ apiKey: OPENAI_API_KEY });
    const openai = new OpenAIApi(configuration);
    
    // Générer l'histoire avec OpenAI
    const completion = await openai.createChatCompletion({
      model: 'gpt-4',
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
          Ceci est une nouvelle tentative, alors essaie une approche différente.`
        }
      ],
      temperature: 0.8, // Augmenter légèrement la température pour plus de diversité
      max_tokens: 4000,
    });

    const storyText = completion.data.choices[0].message?.content;
    
    if (!storyText) {
      throw new Error('Aucune histoire générée par OpenAI');
    }

    // Générer un résumé
    const summaryCompletion = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
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
      model: 'gpt-3.5-turbo',
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

    const title = titleCompletion.data.choices[0].message?.content?.replace(/["']/g, '') || `Histoire pour ${childrenNames.join(' et ')}`;

    // Mettre à jour l'histoire dans la base de données
    const { error: updateError } = await supabase
      .from('stories')
      .update({
        title,
        content: storyText,
        summary,
        preview: storyText.substring(0, 200) + "...",
        status: 'completed',
        error: null,
        updatedat: new Date().toISOString()
      })
      .eq('id', storyId);

    if (updateError) {
      throw updateError;
    }
    
    console.log('Histoire régénérée avec succès:', { storyId, title });

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Histoire régénérée avec succès',
        title,
        summary,
        preview: storyText.substring(0, 200) + "..."
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Erreur lors de la nouvelle tentative:', error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'Erreur lors de la nouvelle tentative' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
