
import OpenAI from 'openai';
import { getSecret } from '../secretManager';

let openai = new OpenAI({
  apiKey: 'placeholder'
});

let apiKeyInitialized = false;

export const initializeOpenAI = async (): Promise<void> => {
  if (apiKeyInitialized) return;
  
  try {
    const apiKey = await getSecret('openai-api-key');
    
    if (!apiKey || typeof apiKey !== 'string' || !apiKey.trim()) {
      throw new Error("La clé API OpenAI récupérée est invalide");
    }
    
    openai = new OpenAI({ apiKey });
    apiKeyInitialized = true;
    console.log("Client OpenAI initialisé avec succès");
  } catch (error) {
    console.error("Erreur lors de l'initialisation du client OpenAI:", error);
    apiKeyInitialized = false;
    throw new Error(`Impossible d'initialiser le client OpenAI: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const resetOpenAIClient = (): void => {
  apiKeyInitialized = false;
};

export { openai };
