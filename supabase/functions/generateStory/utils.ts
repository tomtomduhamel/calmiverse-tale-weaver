
import { 
  corsHeaders, 
  initializeOpenAI, 
  initializeSupabase,
  validateInput,
  generateStoryText,
  generateSummary,
  generateTitle,
  updateStoryInDb,
  checkStoryExists,
  fetchStoryDataFromDb
} from "../_shared/story-utils.ts";
import { selectSoundForObjective } from "./sound-utils.ts";

export { corsHeaders };

/**
 * Handle OPTIONS request for CORS preflight
 */
export function handleOptionsRequest() {
  return new Response(null, { headers: corsHeaders });
}

/**
 * Parse the request body
 */
export async function parseRequestBody(req: Request) {
  return await req.json().catch(error => {
    console.error("Erreur lors de la lecture du corps de la requête:", error);
    throw new Error("Format de requête invalide");
  });
}

/**
 * Validate data and prepare for story generation
 */
export async function validateAndPrepareData(supabase: any, storyId: string, objective?: string, childrenNames?: string[]) {
  try {
    // Verify if the story exists and retrieve its basic data
    await checkStoryExists(supabase, storyId);
    
    // If parameters are missing, retrieve them from the database
    if (!objective || !childrenNames || childrenNames.length === 0) {
      console.log("Paramètres manquants, récupération depuis la base de données...");
      
      const storyDetails = await fetchStoryDataFromDb(supabase, storyId);
      
      objective = objective || storyDetails.objective;
      childrenNames = childrenNames || storyDetails.childrennames;
      
      console.log("Données récupérées depuis la base de données:", { 
        objective, 
        childrenNames,
        status: storyDetails.status
      });
      
      // If the story has already been completed, return the existing data
      if (storyDetails.status === 'completed') {
        return {
          isExistingStory: true,
          storyDetails
        };
      }
    }
    
    // Validate the data
    validateInput(storyId, objective as string, childrenNames as string[]);
    
    return {
      isExistingStory: false,
      objective,
      childrenNames
    };
  } catch (error) {
    console.error("Erreur lors de la validation et préparation:", error);
    throw error;
  }
}

/**
 * Return response for an existing completed story
 */
export function returnExistingStory(storyDetails: any) {
  console.log(`L'histoire ${storyDetails.id} est déjà complétée, retour des données existantes`);
  
  return new Response(
    JSON.stringify({
      success: true,
      message: "Histoire déjà générée",
      storyData: {
        title: storyDetails.title,
        content: storyDetails.content,
        summary: storyDetails.summary,
        preview: storyDetails.preview,
        status: 'completed'
      }
    }),
    {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    }
  );
}

/**
 * Generate story content
 */
export async function generateStoryContent(storyId: string, objective?: string, childrenNames?: string[]) {
  // Initialize Supabase client
  const supabase = initializeSupabase();
  
  // Validate and prepare data
  const preparedData = await validateAndPrepareData(supabase, storyId, objective, childrenNames);
  
  // If the story already exists and is completed, return it
  if (preparedData.isExistingStory) {
    return returnExistingStory(preparedData.storyDetails);
  }
  
  // Extract validated data
  objective = preparedData.objective;
  childrenNames = preparedData.childrenNames;
  
  console.log(`Génération d'histoire pour: ID=${storyId}, objectif=${objective}, enfants=${childrenNames?.join(', ')}`);
  
  // Update story status to "pending" before starting
  await updateStoryInDb(supabase, storyId, {
    title: `Histoire en cours de création pour ${childrenNames?.join(' et ')}`,
    content: '',
    summary: 'Génération en cours...',
    preview: 'Histoire en cours de création...',
    status: 'pending',
    error: null
  });
  
  // Get the OpenAI API key
  const openAIApiKey = initializeOpenAI();
  
  try {
    console.log("Début de la génération du texte de l'histoire...");
    
    // Generate the main story text
    const storyText = await generateStoryText(openAIApiKey, objective as string, childrenNames as string[]);
    console.log(`Texte généré avec succès (${storyText.length} caractères)`);
    
    // Generate the summary
    console.log("Génération du résumé...");
    const summary = await generateSummary(openAIApiKey, storyText);
    
    // Generate a title
    console.log("Génération du titre...");
    const title = await generateTitle(openAIApiKey, storyText, childrenNames as string[]);
    
    // Create a preview from the beginning of the story
    const preview = storyText.substring(0, 200) + "...";
    
    // Find an appropriate sound for the story objective
    let sound_id = await selectSoundForObjective(supabase, objective as string);
    
    // Update the story in the database
    await updateStoryInDb(supabase, storyId, {
      title,
      content: storyText,
      summary,
      preview,
      sound_id,
      status: 'completed',
      error: null
    });

    console.log(`✅ Histoire générée avec succès: ID=${storyId}, titre=${title}, son=${sound_id}`);
    
    return new Response(
      JSON.stringify({
        success: true,
        storyData: {
          title,
          content: storyText,
          summary,
          preview,
          sound_id
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
    console.error("❌ Erreur lors de la génération:", error.message, error.stack);
    
    // Update the error status of the story
    await updateStoryInDb(supabase, storyId, {
      status: 'error',
      error: error.message || 'Erreur inconnue lors de la génération'
    });
      
    throw error;
  }
}
