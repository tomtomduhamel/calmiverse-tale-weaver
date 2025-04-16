
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
 * @param secretName Nom du secret à récupérer
 * @returns La valeur du secret sous forme de chaîne
 */
export const getSecret = async (secretName: string): Promise<string> => {
  if (!secretName || typeof secretName !== 'string') {
    throw new Error("Nom de secret invalide: doit être une chaîne non vide");
  }

  try {
    // Logique spécifique pour l'environnement de développement
    if (process.env.NODE_ENV === 'development' || process.env.FUNCTIONS_EMULATOR === 'true') {
      console.log(`Environnement de développement détecté, recherche de variable d'environnement pour ${secretName}`);
      
      // Pour openai-api-key, utiliser directement OPENAI_API_KEY
      if (secretName === 'openai-api-key' && process.env.OPENAI_API_KEY) {
        const apiKey = process.env.OPENAI_API_KEY;
        if (typeof apiKey === 'string' && apiKey.trim() !== '') {
          return apiKey;
        }
        throw new Error("La variable OPENAI_API_KEY existe mais n'est pas une chaîne valide");
      }
      
      // Convertir nom-de-secret en NOM_DE_SECRET pour recherche env var
      const envVar = secretName.toUpperCase().replace(/-/g, '_');
      if (process.env[envVar]) {
        const value = process.env[envVar];
        if (typeof value === 'string' && value.trim() !== '') {
          return value;
        }
        throw new Error(`Variable d'environnement ${envVar} existe mais n'est pas une chaîne valide`);
      }
      
      throw new Error(`Variable d'environnement ${envVar} non trouvée en développement`);
    }
    
    // Vérification du client
    if (!client) {
      throw new Error("Client Secret Manager non initialisé ou non disponible");
    }
    
    // Récupération du projectId depuis les variables d'environnement
    const projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT;
    
    if (!projectId || typeof projectId !== 'string' || projectId.trim() === '') {
      throw new Error("ID du projet Google Cloud non défini ou invalide");
    }
    
    console.log(`Tentative d'accès au secret '${secretName}' dans le projet '${projectId}'`);
    
    // Format du nom complet du secret
    const name = `projects/${projectId}/secrets/${secretName}/versions/latest`;
    
    // Récupération du secret
    const [version] = await client.accessSecretVersion({ name });
    
    if (!version.payload?.data) {
      throw new Error(`Secret '${secretName}' non trouvé ou vide`);
    }
    
    console.log(`Secret '${secretName}' récupéré avec succès`);
    const data = version.payload.data.toString();
    
    if (!data || data.trim() === '') {
      throw new Error(`Secret '${secretName}' récupéré est vide ou invalide`);
    }
    
    return data;
  } catch (error) {
    console.error(`Erreur d'accès au secret '${secretName}':`, error);
    
    // Dernier recours: vérifier la variable d'environnement directe
    if (secretName === 'openai-api-key' && process.env.OPENAI_API_KEY) {
      console.log("Utilisation de OPENAI_API_KEY comme dernier recours");
      const apiKey = process.env.OPENAI_API_KEY;
      if (typeof apiKey === 'string' && apiKey.trim() !== '') {
        return apiKey;
      }
      throw new Error("La variable OPENAI_API_KEY existe en dernier recours mais n'est pas une chaîne valide");
    }
    
    throw new Error(`Impossible d'accéder au secret '${secretName}': ${error instanceof Error ? error.message : String(error)}`);
  }
};
