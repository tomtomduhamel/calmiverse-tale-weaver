
import OpenAI from 'openai';
import { getSecret } from '../secretManager';

// Initialiser avec une clé API placeholder
let openai = new OpenAI({
  apiKey: 'placeholder', // Sera remplacé avant utilisation
});

let apiKeyInitialized = false;

/**
 * Initialise le client OpenAI avec une clé provenant de Secret Manager ou des variables d'environnement
 */
export const initializeOpenAI = async () => {
  if (apiKeyInitialized) {
    return;
  }
  
  try {
    let apiKey: string;
    
    // Essayer d'obtenir la clé API depuis les variables d'environnement d'abord
    if (process.env.OPENAI_API_KEY) {
      console.log("Tentative d'utilisation de la variable d'environnement OPENAI_API_KEY");
      const envApiKey = process.env.OPENAI_API_KEY;
      
      if (typeof envApiKey !== 'string' || envApiKey.trim() === '') {
        console.error("La variable d'environnement OPENAI_API_KEY est définie mais invalide");
        throw new Error("La variable d'environnement OPENAI_API_KEY est définie mais n'est pas une chaîne valide");
      }
      
      console.log("Utilisation de la variable d'environnement OPENAI_API_KEY");
      apiKey = envApiKey;
    } else {
      // Fallback vers Secret Manager
      console.log("Tentative de récupération de la clé API depuis Secret Manager");
      try {
        apiKey = await getSecret('openai-api-key');
        if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '') {
          throw new Error("La clé API OpenAI récupérée est invalide");
        }
        console.log("API Key récupérée avec succès depuis Secret Manager");
      } catch (error) {
        console.error("Erreur lors de la récupération depuis Secret Manager:", error);
        throw new Error(`La clé API OpenAI n'a pas pu être récupérée: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    // Vérification supplémentaire
    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '') {
      throw new Error("Aucune clé API OpenAI valide trouvée");
    }
    
    // Créer une nouvelle instance avec la clé récupérée
    openai = new OpenAI({ apiKey });
    apiKeyInitialized = true;
    console.log("Client OpenAI initialisé avec succès");
  } catch (error) {
    console.error("Erreur lors de l'initialisation du client OpenAI:", error);
    apiKeyInitialized = false; // Marquer comme non initialisé pour permettre de réessayer
    throw new Error(`Impossible d'initialiser le client OpenAI: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export { openai };
