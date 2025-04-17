
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

// Initialisation du client Secret Manager avec configuration explicite des options
let client: SecretManagerServiceClient | null = null;

try {
  client = new SecretManagerServiceClient();
  console.log("Client Secret Manager initialisé avec succès");
} catch (error) {
  console.error("Erreur lors de l'initialisation du client Secret Manager:", error);
  client = null;
}

/**
 * Récupère une valeur de secret depuis Google Cloud Secret Manager
 */
export const getSecret = async (secretName: string): Promise<string> => {
  if (!secretName || typeof secretName !== 'string') {
    throw new Error("Nom de secret invalide: doit être une chaîne non vide");
  }

  // Logique spécifique pour l'environnement de développement
  if (process.env.NODE_ENV === 'development' || process.env.FUNCTIONS_EMULATOR === 'true') {
    const envVar = secretName.toUpperCase().replace(/-/g, '_');
    
    // Vérification spéciale pour OpenAI API Key
    if (secretName === 'openai-api-key') {
      const apiKey = process.env.OPENAI_API_KEY || "";
      if (apiKey && apiKey.trim()) {
        return apiKey;
      }
      throw new Error("OPENAI_API_KEY non définie ou invalide");
    }
    
    // Vérification des autres variables d'environnement
    const envValue = process.env[envVar] || "";
    if (envValue && envValue.trim()) {
      return envValue;
    }
    throw new Error(`Variable d'environnement ${envVar} non trouvée ou invalide`);
  }
  
  if (!client) {
    throw new Error("Client Secret Manager non initialisé");
  }
  
  // Résolution du problème de type ici - s'assurer que projectId n'est jamais undefined
  const projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT || "";
  if (!projectId) {
    throw new Error("ID du projet Google Cloud non défini");
  }
  
  const name = `projects/${projectId}/secrets/${secretName}/versions/latest`;
  
  try {
    const [version] = await client.accessSecretVersion({ name });
    
    if (!version.payload || !version.payload.data) {
      throw new Error(`Secret '${secretName}' non trouvé ou vide`);
    }
    
    const data = version.payload.data.toString();
    if (!data || !data.trim()) {
      throw new Error(`Secret '${secretName}' récupéré est vide`);
    }
    
    return data;
  } catch (error) {
    // Dernier recours pour OpenAI API Key
    if (secretName === 'openai-api-key' && process.env.OPENAI_API_KEY) {
      const apiKey = process.env.OPENAI_API_KEY || "";
      if (apiKey && apiKey.trim()) {
        return apiKey;
      }
    }
    
    throw new Error(`Impossible d'accéder au secret '${secretName}': ${error instanceof Error ? error.message : String(error)}`);
  }
};
