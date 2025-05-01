
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { 
  corsHeaders, 
  initializeOpenAI, 
  initializeSupabase,
  generateStoryText,
  generateSummary,
  generateTitle,
  updateStoryInDb
} from "../_shared/story-utils.ts";

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
    
    // Initialiser le client Supabase et l'API OpenAI
    const supabase = initializeSupabase();
    const openai = initializeOpenAI();
    
    try {
      // Générer le texte principal de l'histoire
      const storyText = await generateStoryText(openai, objective, childrenNames);
      
      // Générer le résumé de l'histoire
      const summary = await generateSummary(openai, storyText);
      
      // Générer un titre pour l'histoire
      const title = await generateTitle(openai, storyText, childrenNames);
      
      // Mettre à jour l'histoire dans la base de données
      await updateStoryInDb(supabase, storyId, {
        title,
        content: storyText,
        summary,
        preview: storyText.substring(0, 200) + "...",
        status: 'completed',
        error: null
      });

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
    } catch (error) {
      console.error("Erreur lors de la génération:", error);
      
      // Mettre à jour le statut d'erreur de l'histoire
      await supabase
        .from('stories')
        .update({
          status: 'error',
          error: error.message || 'Erreur inconnue',
          updatedat: new Date().toISOString()
        })
        .eq('id', storyId);
        
      throw error;
    }
  } catch (error: any) {
    console.error("Erreur:", error);

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
