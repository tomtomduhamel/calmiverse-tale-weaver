
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
    // Try to get API key from Secret Manager
    const secretApiKey = await getSecret('openai-api-key');
    
    console.log("API Key récupérée avec succès depuis Secret Manager");
    openai = new OpenAI({ apiKey: secretApiKey });
    apiKeyInitialized = true;
  } catch (secretError: any) {
    console.warn('Failed to get API key from Secret Manager:', secretError);
    
    // Fall back to environment variable
    const envApiKey = process.env.OPENAI_API_KEY;
    if (envApiKey) {
      console.log("Utilisation de la variable d'environnement OPENAI_API_KEY");
      openai = new OpenAI({ apiKey: envApiKey });
      apiKeyInitialized = true;
    } else {
      throw new Error("Impossible de récupérer la clé API OpenAI. Vérifiez que le secret ou la variable d'environnement est configuré.");
    }
  }
};

export { openai };
