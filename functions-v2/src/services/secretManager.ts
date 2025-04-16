
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

// Initialize Secret Manager client
const client = new SecretManagerServiceClient();

/**
 * Récupère une valeur de secret depuis Google Cloud Secret Manager
 * avec fallback pour les environnements de développement
 * @param secretName Nom du secret à récupérer
 * @returns La valeur du secret sous forme de chaîne
 */
export const getSecret = async (secretName: string): Promise<string> => {
  try {
    // Vérifier d'abord si nous sommes en environnement de développement
    if (process.env.NODE_ENV === 'development' || process.env.FUNCTIONS_EMULATOR === 'true') {
      console.log(`Environnement de développement détecté, utilisation des variables d'environnement pour ${secretName}`);
      const envVar = secretName.toUpperCase().replace(/-/g, '_');
      const envValue = process.env[envVar];
      
      if (envValue) {
        return envValue;
      }
      
      // Pour faciliter le développement, si OPENAI_API_KEY est défini, on l'utilise pour openai-api-key
      if (secretName === 'openai-api-key' && process.env.OPENAI_API_KEY) {
        return process.env.OPENAI_API_KEY;
      }
      
      console.warn(`Variable d'environnement ${envVar} non trouvée, utilisation d'une valeur de test`);
      return 'mock-secret-value-for-development';
    }
    
    // En production, récupérer le projectId correctement
    const projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT || 'calmi-99482';
    
    console.log(`Récupération du secret '${secretName}' depuis le projet '${projectId}'`);
    
    const name = `projects/${projectId}/secrets/${secretName}/versions/latest`;
    
    // Récupérer la version du secret
    const [version] = await client.accessSecretVersion({
      name: name,
    });

    // Vérifier que la charge utile du secret existe
    if (!version.payload?.data) {
      throw new Error(`Secret '${secretName}' non trouvé ou avec une charge utile vide`);
    }

    console.log(`Secret '${secretName}' récupéré avec succès`);
    return version.payload.data.toString();
  } catch (error) {
    console.error(`Erreur d'accès au secret '${secretName}':`, error);
    
    // Fallback pour OPENAI_API_KEY si disponible
    if (secretName === 'openai-api-key' && process.env.OPENAI_API_KEY) {
      console.log(`Utilisation de la variable d'environnement OPENAI_API_KEY comme fallback`);
      return process.env.OPENAI_API_KEY;
    }
    
    throw new Error(`Impossible d'accéder au secret '${secretName}'. Vérifiez les permissions et la configuration.`);
  }
};
