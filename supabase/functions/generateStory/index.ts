
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { 
  corsHeaders,
  handleOptionsRequest,
  parseRequestBody,
  generateStoryContent,
} from "./utils.ts";

serve(async (req) => {
  console.log(`🔥 [generateStory] ${req.method} ${req.url} à ${new Date().toISOString()}`);
  console.log(`📡 [generateStory] Headers:`, Object.fromEntries(req.headers.entries()));

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('✅ [generateStory] Réponse OPTIONS/CORS');
    return handleOptionsRequest();
  }

  if (req.method !== 'POST') {
    console.error(`❌ [generateStory] Méthode non autorisée: ${req.method}`);
    return new Response(
      JSON.stringify({ error: 'Méthode non autorisée' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    console.log('📥 [generateStory] Lecture du corps de la requête...');
    const requestBody = await parseRequestBody(req);
    console.log("📋 [generateStory] Corps de la requête:", JSON.stringify(requestBody, null, 2));
    
    // Extract the storyId which is mandatory
    const { storyId, objective, childrenNames } = requestBody;
    
    if (!storyId) {
      console.error('❌ [generateStory] storyId manquant');
      throw new Error("ID d'histoire manquant dans la requête");
    }
    
    console.log(`🎯 [generateStory] Traitement pour histoire ID: ${storyId}`);
    console.log(`🎯 [generateStory] Objectif: ${objective}`);
    console.log(`🎯 [generateStory] Enfants: ${childrenNames?.join(', ')}`);
    
    // Process the story generation request
    const result = await generateStoryContent(storyId, objective, childrenNames);
    
    console.log('✅ [generateStory] Génération terminée avec succès');
    return result;
    
  } catch (error: any) {
    console.error("💥 [generateStory] ERREUR GLOBALE:", error.message);
    console.error("📋 [generateStory] Stack trace:", error.stack);

    const errorResponse = {
      error: true,
      message: error.message || "Une erreur est survenue lors de la génération de l'histoire",
      details: error.stack ? error.stack.split("\n").slice(0, 3).join(" → ") : "Pas de détails",
      timestamp: new Date().toISOString()
    };

    console.error("📤 [generateStory] Réponse d'erreur:", JSON.stringify(errorResponse, null, 2));

    return new Response(
      JSON.stringify(errorResponse),
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
