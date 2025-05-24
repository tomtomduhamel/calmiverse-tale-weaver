
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { 
  corsHeaders,
  handleOptionsRequest,
  parseRequestBody,
  generateStoryContent,
} from "./utils.ts";

serve(async (req) => {
  const requestId = crypto.randomUUID().slice(0, 8);
  console.log(`🔥 [generateStory-${requestId}] NOUVELLE REQUÊTE ${req.method} ${req.url}`);
  console.log(`⏰ [generateStory-${requestId}] Timestamp: ${new Date().toISOString()}`);
  console.log(`📡 [generateStory-${requestId}] Origin: ${req.headers.get('origin')}`);
  console.log(`🔧 [generateStory-${requestId}] User-Agent: ${req.headers.get('user-agent')}`);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log(`✅ [generateStory-${requestId}] Réponse CORS OPTIONS`);
    return handleOptionsRequest();
  }

  if (req.method !== 'POST') {
    console.error(`❌ [generateStory-${requestId}] Méthode non autorisée: ${req.method}`);
    return new Response(
      JSON.stringify({ error: 'Méthode non autorisée', requestId }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  console.log(`🎯 [generateStory-${requestId}] REQUÊTE POST REÇUE - SUCCÈS!`);
  console.log(`📋 [generateStory-${requestId}] Headers complets:`, Object.fromEntries(req.headers.entries()));

  try {
    console.log(`📥 [generateStory-${requestId}] Lecture du corps de la requête...`);
    const requestBody = await parseRequestBody(req);
    console.log(`📋 [generateStory-${requestId}] Corps reçu:`, JSON.stringify(requestBody, null, 2));
    
    const { storyId, objective, childrenNames } = requestBody;
    
    if (!storyId) {
      console.error(`❌ [generateStory-${requestId}] storyId manquant`);
      throw new Error("ID d'histoire manquant dans la requête");
    }
    
    console.log(`🎯 [generateStory-${requestId}] Traitement histoire ID: ${storyId}`);
    console.log(`🎯 [generateStory-${requestId}] Objectif: ${objective}`);
    console.log(`🎯 [generateStory-${requestId}] Enfants: ${childrenNames?.join(', ')}`);
    
    // Traitement de la génération
    const result = await generateStoryContent(storyId, objective, childrenNames);
    
    console.log(`✅ [generateStory-${requestId}] Génération terminée avec succès`);
    return result;
    
  } catch (error: any) {
    console.error(`💥 [generateStory-${requestId}] ERREUR GLOBALE:`, error.message);
    console.error(`📋 [generateStory-${requestId}] Stack trace:`, error.stack);

    const errorResponse = {
      error: true,
      message: error.message || "Une erreur est survenue lors de la génération de l'histoire",
      requestId,
      timestamp: new Date().toISOString()
    };

    console.error(`📤 [generateStory-${requestId}] Réponse d'erreur:`, JSON.stringify(errorResponse, null, 2));

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
