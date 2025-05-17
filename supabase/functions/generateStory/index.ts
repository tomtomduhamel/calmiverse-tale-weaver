
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { 
  corsHeaders, 
  initializeOpenAI, 
  initializeSupabase,
  validateInput,
  generateStoryText,
  generateSummary,
  generateTitle,
  updateStoryInDb,
  checkStoryExists
} from "../_shared/story-utils.ts";

serve(async (req) => {
  // Gérer les requêtes CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Récupérer les données de la requête
    const requestBody = await req.json().catch(error => {
      console.error("Erreur lors de la lecture du corps de la requête:", error);
      throw new Error("Format de requête invalide");
    });
    
    console.log("Requête reçue pour la génération d'histoire:", requestBody);
    
    let { storyId, objective, childrenNames } = requestBody;

    // Initialiser le client Supabase
    const supabase = initializeSupabase();
    
    // Vérifier si l'histoire existe
    await checkStoryExists(supabase, storyId);
    
    // Si les paramètres objective ou childrenNames sont manquants, les récupérer depuis la base de données
    if (!objective || !childrenNames || childrenNames.length === 0) {
      console.log("Paramètres manquants, récupération depuis la base de données...");
      
      const { data: storyData, error: storyError } = await supabase
        .from("stories")
        .select("objective, childrennames")
        .eq("id", storyId)
        .single();
      
      if (storyError) {
        console.error("Erreur lors de la récupération des données de l'histoire:", storyError);
        throw new Error("Impossible de récupérer les données de l'histoire");
      }
      
      objective = storyData.objective || objective;
      childrenNames = storyData.childrennames || childrenNames;
      
      console.log("Données récupérées depuis la base de données:", { objective, childrenNames });
    }

    // Validation des données d'entrée avec les données potentiellement récupérées
    try {
      validateInput(storyId, objective, childrenNames);
    } catch (validationError) {
      console.error("Validation échouée:", validationError.message);
      
      // Mettre à jour le statut d'erreur de l'histoire
      await updateStoryInDb(supabase, storyId, {
        status: 'error',
        error: validationError.message || 'Erreur de validation des données'
      });
      
      return new Response(
        JSON.stringify({
          error: true,
          message: validationError.message
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Génération d'histoire pour: ID=${storyId}, objectif=${objective}, enfants=${childrenNames.join(', ')}`);
    
    // Mettre à jour le statut à "pending" avant de commencer
    await updateStoryInDb(supabase, storyId, {
      title: `Histoire en cours de création pour ${childrenNames.join(' et ')}`,
      content: '',
      summary: 'Génération en cours...',
      preview: 'Histoire en cours de création...',
      status: 'pending',
      error: null
    });
    
    // Obtenir la clé API OpenAI
    const openAIApiKey = initializeOpenAI();
    
    try {
      console.log("Début de la génération du texte de l'histoire...");
      
      // Générer le texte principal de l'histoire
      const storyText = await generateStoryText(openAIApiKey, objective, childrenNames);
      console.log(`Texte généré avec succès (${storyText.length} caractères)`);
      
      // Générer le résumé de l'histoire
      console.log("Génération du résumé...");
      const summary = await generateSummary(openAIApiKey, storyText);
      
      // Générer un titre pour l'histoire
      console.log("Génération du titre...");
      const title = await generateTitle(openAIApiKey, storyText, childrenNames);
      
      // Créer un extrait (preview) à partir du début de l'histoire
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

      console.log(`Histoire générée avec succès: ID=${storyId}, titre=${title}`);
      
      return new Response(
        JSON.stringify({
          success: true,
          storyData: {
            title,
            content: storyText,
            summary,
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
    } catch (error) {
      console.error("Erreur lors de la génération:", error);
      
      // Mettre à jour le statut d'erreur de l'histoire
      await updateStoryInDb(supabase, storyId, {
        status: 'error',
        error: error.message || 'Erreur inconnue lors de la génération'
      });
        
      throw error;
    }
  } catch (error: any) {
    console.error("Erreur globale:", error);

    return new Response(
      JSON.stringify({
        error: true,
        message: error.message || "Une erreur est survenue lors de la génération de l'histoire",
        details: error.stack ? error.stack.split("\n").slice(0, 3).join(" → ") : "Pas de détails"
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
