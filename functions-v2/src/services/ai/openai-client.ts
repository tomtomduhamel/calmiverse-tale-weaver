
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
      console.log("Utilisation de la variable d'environnement OPENAI_API_KEY");
      const envApiKey = process.env.OPENAI_API_KEY;
      if (!envApiKey) {
        throw new Error("La variable d'environnement OPENAI_API_KEY est définie mais vide");
      }
      apiKey = envApiKey;
    } else {
      // Fallback vers Secret Manager
      console.log("Tentative de récupération de la clé API depuis Secret Manager");
      try {
        apiKey = await getSecret('openai-api-key');
        console.log("API Key récupérée avec succès depuis Secret Manager");
      } catch (error) {
        console.error("Erreur lors de la récupération depuis Secret Manager:", error);
        throw new Error("La clé API OpenAI n'a pas pu être récupérée");
      }
    }
    
    if (!apiKey) {
      throw new Error("Aucune clé API OpenAI trouvée");
    }
    
    // Créer une nouvelle instance avec la clé récupérée
    openai = new OpenAI({ apiKey });
    apiKeyInitialized = true;
    console.log("Client OpenAI initialisé avec succès");
  } catch (error) {
    console.error("Erreur lors de l'initialisation du client OpenAI:", error);
    throw new Error("Impossible d'initialiser le client OpenAI");
  }
};

export { openai };
