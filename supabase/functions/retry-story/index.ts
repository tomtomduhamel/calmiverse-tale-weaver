
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { 
  corsHeaders, 
  initializeOpenAI, 
  initializeSupabase,
  generateStoryText,
  generateSummary,
  generateTitle,
  updateStoryInDb,
  checkStoryExists
} from "../_shared/story-utils.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Récupérer les données de la requête
    const requestData = await req.json().catch(error => {
      console.error("Erreur lors de la lecture du corps de la requête:", error);
      throw new Error("Format de requête invalide");
    });
    
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
      console.error("ID d'histoire manquant dans la requête");
      return new Response(
        JSON.stringify({ 
          error: true, 
          message: "Paramètre manquant: storyId est requis" 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Requête de relance reçue pour l'histoire: ${storyId}`);

    // Initialiser le client Supabase et l'API OpenAI
    const supabase = initializeSupabase();
    const openAIApiKey = initializeOpenAI();
    
    // Récupérer l'histoire existante
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .select('*')
      .eq('id', storyId)
      .single();
      
    if (storyError || !story) {
      console.error("Erreur lors de la récupération de l'histoire:", storyError);
      return new Response(
        JSON.stringify({ 
          error: true, 
          message: "Histoire non trouvée",
          details: storyError ? storyError.message : "Données manquantes"
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    const { objective, childrennames: childrenNames } = story;

    // Validation des données
    if (!objective) {
      throw new Error("L'objectif de l'histoire est manquant");
    }
    
    if (!childrenNames || childrenNames.length === 0) {
      throw new Error("Les noms des enfants sont manquants");
    }

    console.log('Nouvelle tentative de génération pour:', { storyId, objective, childrenNames });

    // Mettre à jour le statut à "pending"
    await updateStoryInDb(supabase, storyId, {
      status: 'pending',
      error: null
    });

    try {
      console.log("Début de la génération d'une nouvelle version de l'histoire...");
      
      // Générer une nouvelle version de l'histoire
      const storyText = await generateStoryText(openAIApiKey, objective, childrenNames, true);
      console.log(`Nouvelle version générée avec succès (${storyText.length} caractères)`);
      
      // Générer un nouveau résumé
      console.log("Génération du nouveau résumé...");
      const summary = await generateSummary(openAIApiKey, storyText);
      
      // Générer un nouveau titre
      console.log("Génération du nouveau titre...");
      const title = await generateTitle(openAIApiKey, storyText, childrenNames);
      
      // Créer un nouvel extrait
      const preview = storyText.substring(0, 200) + "...";
      
      // Mettre à jour l'histoire dans la base de données
      await updateStoryInDb(supabase, storyId, {
        title,
        content: storyText,
        summary,
        preview,
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
          preview
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    } catch (error) {
      console.error('Erreur lors de la génération:', error);
      
      // Mettre à jour l'histoire avec une erreur
      await updateStoryInDb(supabase, storyId, {
        status: 'error',
        error: error.message || 'Erreur lors de la génération'
      });
        
      throw error;
    }
  } catch (error: any) {
    console.error('Erreur lors de la nouvelle tentative:', error);
    
    return new Response(
      JSON.stringify({ 
        error: true, 
        message: error.message || 'Erreur lors de la nouvelle tentative',
        details: error.stack ? error.stack.split("\n").slice(0, 3).join(" → ") : "Pas de détails"
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
