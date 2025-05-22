
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { 
  corsHeaders,
  handleOptionsRequest,
  parseRequestBody,
  generateStoryContent,
  validateAndPrepareData,
  returnExistingStory
} from "./utils.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return handleOptionsRequest();
  }

  try {
    // Parse request body and extract required parameters
    const requestBody = await parseRequestBody(req);
    console.log("Requête reçue pour la génération d'histoire:", requestBody);
    
    // Extract the storyId which is mandatory
    const { storyId } = requestBody;
    if (!storyId) {
      throw new Error("ID d'histoire manquant dans la requête");
    }
    
    // Extract optional parameters
    let { objective, childrenNames } = requestBody;
    
    // Process the story generation request
    return await generateStoryContent(storyId, objective, childrenNames);
  } catch (error: any) {
    console.error("❌ Erreur globale:", error.message, error.stack);

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
