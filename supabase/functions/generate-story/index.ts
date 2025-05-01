
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.5";

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

    // Pour cette version, nous allons générer une histoire simple
    // Dans une version future, on pourra intégrer un modèle IA comme OpenAI
    const title = `L'aventure de ${childrenNames.join(' et ')}`;
    const story_text = `
      Il était une fois ${childrenNames.join(' et ')} qui ${objective.toLowerCase()}. 
      Après beaucoup d'efforts et de péripéties, ils ont réussi et sont rentrés chez eux 
      heureux et enrichis par cette expérience.

      C'était une journée ensoleillée comme les autres quand l'aventure a commencé. ${childrenNames.join(' et ')} 
      se sont retrouvés face à un défi qu'ils n'avaient jamais imaginé.

      "N'ayons pas peur," dit ${childrenNames[0]}. "Ensemble, nous pouvons y arriver."

      Et c'est ainsi que leur aventure a commencé, une aventure qui allait les transformer et 
      leur apprendre beaucoup sur eux-mêmes et sur la vie.
    `;

    const story_summary = `Une histoire où ${childrenNames.join(' et ')} ${objective.toLowerCase()}`;
    const preview = `${childrenNames.join(' et ')} partent à l'aventure...`;

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
    const { data, error } = await supabase
      .from('stories')
      .update({
        title,
        content: story_text,
        summary: story_summary,
        preview,
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
          story_text,
          story_summary,
          preview
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
