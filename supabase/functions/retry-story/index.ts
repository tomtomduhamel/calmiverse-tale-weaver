
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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Récupérer les données de la requête
    const requestData = await req.json();
    
    // Traitement du ping pour le test de connexion
    if (requestData.ping) {
      console.log("Ping de test reçu");
      return new Response(
        JSON.stringify({ success: true, message: "Edge Function accessible" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { storyId } = requestData;

    if (!storyId) {
      throw new Error('Paramètre manquant: storyId est requis');
    }

    // Initialiser le client Supabase et l'API OpenAI
    const supabase = initializeSupabase();
    const openai = initializeOpenAI();
    
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

    // Mettre à jour le statut à "pending"
    await supabase
      .from('stories')
      .update({
        status: 'pending',
        updatedat: new Date().toISOString()
      })
      .eq('id', storyId);

    try {
      // Générer une nouvelle version de l'histoire
      const storyText = await generateStoryText(openai, objective, childrenNames, true);
      
      // Générer un nouveau résumé
      const summary = await generateSummary(openai, storyText);
      
      // Générer un nouveau titre
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
      console.error('Erreur lors de la génération:', error);
      
      // Mettre à jour l'histoire avec une erreur
      await supabase
        .from('stories')
        .update({
          status: 'error',
          error: error.message || 'Erreur lors de la génération',
          updatedat: new Date().toISOString()
        })
        .eq('id', storyId);
        
      throw error;
    }
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
