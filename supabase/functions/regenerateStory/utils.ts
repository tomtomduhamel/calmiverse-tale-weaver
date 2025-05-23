import { 
  corsHeaders, 
  initializeOpenAI, 
  initializeSupabase,
  checkStoryExists,
  fetchStoryDataFromDb,
  updateStoryInDb
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
 * Validate data and prepare for story regeneration
 */
export async function validateAndPrepareData(storyId: string, settings: any) {
  try {
    const supabase = initializeSupabase();
    
    // Verify if the story exists
    await checkStoryExists(supabase, storyId);
    
    // Retrieve the story details
    const storyDetails = await fetchStoryDataFromDb(supabase, storyId);
    
    // Validate settings object structure
    if (!settings.characters || !Array.isArray(settings.characters)) {
      throw new Error("Format des personnages invalide");
    }
    
    if (!settings.locations || !Array.isArray(settings.locations)) {
      throw new Error("Format des lieux invalide");
    }
    
    if (!settings.atmosphere) {
      throw new Error("Ambiance manquante dans les paramètres");
    }
    
    if (!settings.theme) {
      throw new Error("Thème manquant dans les paramètres");
    }
    
    return {
      storyDetails,
      settings
    };
  } catch (error) {
    console.error("Erreur lors de la validation et préparation:", error);
    throw error;
  }
}

/**
 * Generate a new story text based on custom settings
 */
export async function generateStoryWithSettings(apiKey: string, objective: string, childrenNames: string[], settings: any) {
  console.log(`Régénération du texte de l'histoire avec l'objectif: ${objective} pour: ${childrenNames.join(', ')}`);
  
  try {
    // Préparer les détails des personnages pour le prompt
    const charactersDetails = settings.characters
      .map((char: any) => `${char.name}: ${char.description}`)
      .join("\n");
      
    // Préparer les détails des lieux pour le prompt
    const locationsDetails = settings.locations
      .map((loc: any) => `${loc.name}: ${loc.description}`)
      .join("\n");
      
    // Notes additionnelles (si présentes)
    const additionalNotes = settings.additionalNotes 
      ? `\nNotes additionnelles: ${settings.additionalNotes}`
      : '';
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Tu es un expert en création d'histoires pour enfants. 
            
FORMAT DE L'HISTOIRE :
- Longueur : 6000-10000 mots
- Structure narrative fluide et continue, sans découpage visible
- Pas de titre explicite

RÈGLES FONDAMENTALES :
- Adapte le langage à l'âge de l'enfant
- Crée des personnages mémorables et appropriés
- Utilise des dialogues engageants
- Ajoute des répétitions pour les jeunes enfants
- Évite tout contenu effrayant ou angoissant
- Termine toujours sur une note positive`
          },
          {
            role: 'user',
            content: `Je souhaite créer une histoire personnalisée pour ${childrenNames.join(', ')} avec l'objectif suivant : ${objective}.

PARAMÈTRES PERSONNALISÉS :
Ambiance: ${settings.atmosphere}
Thème principal: ${settings.theme}

PERSONNAGES:
${charactersDetails}

LIEUX:
${locationsDetails}
${additionalNotes}

L'histoire doit suivre la structure donnée tout en restant fluide et naturelle, sans découpage visible en parties.
Assure-toi que l'histoire soit captivante dès le début pour maintenir l'attention des enfants.`
          }
        ],
        temperature: 0.7,
        max_tokens: 3500,
      }),
    });

    // Vérification de la réponse HTTP
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Erreur OpenAI (HTTP):', response.status, response.statusText, errorData);
      throw new Error(`Erreur API OpenAI (${response.status}): ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    
    if (!data || !data.choices || data.choices.length === 0) {
      console.error('Réponse OpenAI invalide:', data);
      throw new Error('Format de réponse OpenAI inattendu');
    }
    
    const storyText = data.choices[0].message?.content;
    
    if (!storyText) {
      throw new Error('Aucune histoire générée par OpenAI');
    }

    console.log('Histoire régénérée avec succès (longueur):', storyText.length);
    return storyText;
  } catch (error) {
    console.error('Erreur lors de la génération du texte:', error);
    throw new Error(`Erreur lors de la régénération de l'histoire: ${error.message || 'Erreur inconnue'}`);
  }
}

/**
 * Generate summary based on custom settings and story text
 */
export async function generateSummaryWithSettings(apiKey: string, storyText: string, settings: any) {
  try {
    console.log('Génération du résumé de l\'histoire régénérée...');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Tu es un assistant qui résume des histoires pour enfants de manière concise.'
          },
          {
            role: 'user',
            content: `Résume cette histoire en 3-4 phrases, en mentionnant le thème principal "${settings.theme}" et l'ambiance "${settings.atmosphere}" : ${storyText.substring(0, 2000)}...`
          }
        ],
        temperature: 0.5,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Erreur OpenAI (résumé):', response.status, response.statusText, errorData);
      throw new Error(`Erreur API OpenAI pour le résumé (${response.status})`);
    }

    const data = await response.json();
    const summary = data.choices[0].message?.content || "Résumé non disponible";
    
    console.log('Résumé généré avec succès (longueur):', summary.length);
    return summary;
  } catch (error) {
    console.error('Erreur lors de la génération du résumé:', error);
    // En cas d'erreur de résumé, on retourne un résumé par défaut plutôt que d'échouer tout le processus
    return `Une histoire avec une ambiance ${settings.atmosphere} sur le thème de ${settings.theme}.`;
  }
}

/**
 * Generate title based on story text and settings
 */
export async function generateTitleWithSettings(apiKey: string, storyText: string, settings: any, childrenNames: string[]) {
  try {
    console.log('Génération du titre de l\'histoire régénérée...');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Tu es un assistant qui crée des titres captivants pour des histoires pour enfants.'
          },
          {
            role: 'user',
            content: `Crée un titre court et captivant pour cette histoire avec une ambiance "${settings.atmosphere}" et le thème "${settings.theme}" : ${storyText.substring(0, 1000)}...`
          }
        ],
        temperature: 0.8,
        max_tokens: 50,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Erreur OpenAI (titre):', response.status, response.statusText, errorData);
      throw new Error(`Erreur API OpenAI pour le titre (${response.status})`);
    }

    const data = await response.json();
    const title = data.choices[0].message?.content?.replace(/["']/g, '') || `Histoire pour ${childrenNames.join(' et ')}`;
    
    console.log('Titre généré avec succès:', title);
    return title;
  } catch (error) {
    console.error('Erreur lors de la génération du titre:', error);
    // En cas d'erreur de titre, on retourne un titre par défaut plutôt que d'échouer tout le processus
    return `Histoire de ${settings.atmosphere} pour ${childrenNames.join(' et ')}`;
  }
}

/**
 * Regenerate a story with custom settings
 */
export async function regenerateStoryWithSettings(storyId: string, settings: any) {
  // Initialize Supabase client
  const supabase = initializeSupabase();
  
  // Fetch the existing story data
  const storyDetails = await fetchStoryDataFromDb(supabase, storyId);
  const childrenNames = storyDetails.childrennames || [];
  const objective = storyDetails.objective || "";
  
  console.log(`Régénération d'histoire pour: ID=${storyId}, objectif=${objective}, enfants=${childrenNames?.join(', ')}`);
  
  // Update story status to "regenerating" before starting
  await updateStoryInDb(supabase, storyId, {
    title: `Histoire en cours de régénération pour ${childrenNames?.join(' et ')}`,
    content: storyDetails.content,
    summary: 'Régénération en cours...',
    preview: 'Histoire en cours de régénération...',
    settings: settings,
    status: 'regenerating',
    error: null
  });
  
  // Get the OpenAI API key
  const openAIApiKey = initializeOpenAI();
  
  try {
    console.log("Début de la régénération du texte de l'histoire...");
    
    // Generate the main story text with custom settings
    const storyText = await generateStoryWithSettings(openAIApiKey, objective as string, childrenNames as string[], settings);
    console.log(`Texte régénéré avec succès (${storyText.length} caractères)`);
    
    // Generate the summary with settings
    console.log("Génération du résumé...");
    const summary = await generateSummaryWithSettings(openAIApiKey, storyText, settings);
    
    // Generate a title with settings
    console.log("Génération du titre...");
    const title = await generateTitleWithSettings(openAIApiKey, storyText, settings, childrenNames as string[]);
    
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
      settings,
      sound_id,
      status: 'ready',
      error: null
    });

    console.log(`✅ Histoire régénérée avec succès: ID=${storyId}, titre=${title}, son=${sound_id}`);
    
    return new Response(
      JSON.stringify({
        success: true,
        storyData: {
          title,
          content: storyText,
          summary,
          preview,
          settings,
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
    console.error("❌ Erreur lors de la régénération:", error.message, error.stack);
    
    // Update the error status of the story
    await updateStoryInDb(supabase, storyId, {
      status: 'error',
      error: error.message || 'Erreur inconnue lors de la régénération'
    });
      
    throw error;
  }
}
