
import OpenAI from 'openai';
import { getSecret } from '../secretManager';

// Initialize with a placeholder API key
let openai = new OpenAI({
  apiKey: 'placeholder', // Will be replaced with actual key before use
});

let apiKeyInitialized = false;

/**
 * Initializes the OpenAI API client with a key from Secret Manager or environment variables
 */
export const initializeOpenAI = async () => {
  if (apiKeyInitialized) {
    return;
  }
  
  try {
    let apiKey;
    
    // Try to get API key from environment first (for local dev and CI/CD)
    if (process.env.OPENAI_API_KEY) {
      console.log("Utilisation de la variable d'environnement OPENAI_API_KEY");
      apiKey = process.env.OPENAI_API_KEY;
    } else {
      // Fall back to Secret Manager (for production)
      console.log("Tentative de récupération de la clé API depuis Secret Manager");
      apiKey = await getSecret('openai-api-key');
      console.log("API Key récupérée avec succès depuis Secret Manager");
    }
    
    if (!apiKey) {
      throw new Error("Aucune clé API OpenAI trouvée");
    }
    
    openai = new OpenAI({ apiKey });
    apiKeyInitialized = true;
    console.log("Client OpenAI initialisé avec succès");
  } catch (error) {
    console.error("Erreur lors de l'initialisation du client OpenAI:", error);
    throw new Error("Impossible d'initialiser le client OpenAI. Vérifiez que la clé API est configurée.");
  }
};

export { openai };
