
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { 
  corsHeaders,
  handleOptionsRequest,
  parseRequestBody,
  validateAndPrepareData,
  regenerateStoryWithSettings
} from "./utils.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return handleOptionsRequest();
  }

  try {
    // Parse request body and extract required parameters
    const requestBody = await parseRequestBody(req);
    console.log("Requête reçue pour la régénération d'histoire:", requestBody);
    
    // Extract the storyId which is mandatory
    const { storyId, settings } = requestBody;
    
    if (!storyId) {
      throw new Error("ID d'histoire manquant dans la requête");
    }

    if (!settings) {
      throw new Error("Paramètres d'histoire manquants dans la requête");
    }
    
    // Validate and prepare data
    const preparedData = await validateAndPrepareData(storyId, settings);
    
    // Regenerate the story with custom settings
    return await regenerateStoryWithSettings(storyId, settings);
  } catch (error: any) {
    console.error("❌ Erreur globale:", error.message, error.stack);

    return new Response(
      JSON.stringify({
        error: true,
        message: error.message || "Une erreur est survenue lors de la régénération de l'histoire",
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
