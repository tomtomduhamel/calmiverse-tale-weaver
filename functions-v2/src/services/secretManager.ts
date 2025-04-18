
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
 * avec une gestion améliorée des erreurs et des cas limites
 */
export const getSecret = async (secretName: string): Promise<string> => {
  if (!secretName || typeof secretName !== 'string') {
    throw new Error("Nom de secret invalide: doit être une chaîne non vide");
  }

  // Logique spécifique pour l'environnement de développement
  if (process.env.NODE_ENV === 'development' || process.env.FUNCTIONS_EMULATOR === 'true') {
    console.log(`Recherche de la variable d'environnement pour ${secretName} en mode développement`);
    
    // Vérification spéciale pour OpenAI API Key
    if (secretName === 'openai-api-key') {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error("OPENAI_API_KEY non définie dans l'environnement de développement");
      }
      console.log("✅ OPENAI_API_KEY trouvée dans l'environnement");
      return apiKey;
    }
    
    // Pour les autres secrets, chercher dans les variables d'environnement
    const envVar = secretName.toUpperCase().replace(/-/g, '_');
    const value = process.env[envVar];
    
    if (!value) {
      throw new Error(`Variable d'environnement ${envVar} non trouvée`);
    }
    
    return value;
  }
  
  if (!client) {
    throw new Error("Client Secret Manager non initialisé");
  }
  
  const projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT;
  if (!projectId) {
    throw new Error("ID du projet Google Cloud non défini");
  }
  
  const name = `projects/${projectId}/secrets/${secretName}/versions/latest`;
  console.log(`Récupération du secret ${secretName} depuis Secret Manager...`);
  
  try {
    const [version] = await client.accessSecretVersion({ name });
    
    if (!version.payload?.data) {
      throw new Error(`Secret '${secretName}' non trouvé ou vide`);
    }
    
    const value = version.payload.data.toString();
    if (!value.trim()) {
      throw new Error(`Secret '${secretName}' est vide`);
    }
    
    console.log(`✅ Secret ${secretName} récupéré avec succès`);
    return value;
  } catch (error) {
    console.error(`Erreur lors de la récupération du secret ${secretName}:`, error);
    
    // Dernier recours pour OpenAI API Key
    if (secretName === 'openai-api-key' && process.env.OPENAI_API_KEY) {
      console.log("Utilisation de OPENAI_API_KEY depuis les variables d'environnement");
      return process.env.OPENAI_API_KEY;
    }
    
    throw new Error(`Impossible d'accéder au secret '${secretName}': ${error instanceof Error ? error.message : String(error)}`);
  }
};

