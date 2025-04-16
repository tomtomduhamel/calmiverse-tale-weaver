
import OpenAI from 'openai';
import { getSecret } from '../secretManager';

// Initialiser avec une clé API placeholder
let openai = new OpenAI({
  apiKey: 'placeholder-to-be-replaced', // Sera remplacé avant utilisation
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
    let apiKey;
    
    // Essayer d'obtenir la clé API depuis les variables d'environnement d'abord (pour le dev local et CI/CD)
    if (process.env.OPENAI_API_KEY) {
      console.log("Utilisation de la variable d'environnement OPENAI_API_KEY");
      apiKey = process.env.OPENAI_API_KEY;
    } else {
      // Fallback vers Secret Manager (pour la production)
      console.log("Tentative de récupération de la clé API depuis Secret Manager");
      try {
        apiKey = await getSecret('openai-api-key');
        console.log("API Key récupérée avec succès depuis Secret Manager");
      } catch (error) {
        console.error("Erreur lors de la récupération depuis Secret Manager:", error);
        
        // Dernière tentative avec la variable d'environnement
        apiKey = process.env.OPENAI_API_KEY;
        if (apiKey) {
          console.log("API Key récupérée depuis la variable d'environnement après échec de Secret Manager");
        } else {
          throw new Error("Aucune source de clé API OpenAI disponible");
        }
      }
    }
    
    if (!apiKey) {
      throw new Error("Aucune clé API OpenAI trouvée");
    }
    
    openai = new OpenAI({ apiKey });
    apiKeyInitialized = true;
    console.log("Client OpenAI initialisé avec succès");
  } catch (error) {
    console.error("Erreur lors de l'initialisation du client OpenAI:", error);
    throw new Error("Impossible d'initialiser le client OpenAI. Vérifiez la configuration des secrets.");
  }
};

export { openai };
