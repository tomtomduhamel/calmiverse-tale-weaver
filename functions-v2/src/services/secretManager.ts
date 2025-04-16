
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

// Initialize Secret Manager client
const client = new SecretManagerServiceClient();

/**
 * Retrieves a secret value from Google Cloud Secret Manager
 * @param secretName Name of the secret to retrieve
 * @returns The secret value as a string
 */
export const getSecret = async (secretName: string): Promise<string> => {
  try {
    const projectId = process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT;
    
    if (!projectId) {
      console.warn('Google Cloud project ID not available in environment, using fallback');
      
      // Check if we're in a development environment
      if (process.env.NODE_ENV === 'development' || process.env.FUNCTIONS_EMULATOR === 'true') {
        console.log('Development environment detected, using mock secret');
        return process.env[secretName.toUpperCase().replace(/-/g, '_')] || 'mock-secret-value';
      }
      
      throw new Error('Google Cloud project ID not available in environment');
    }
    
    console.log(`Récupération du secret '${secretName}' depuis le projet '${projectId}'`);
    
    const name = `projects/${projectId}/secrets/${secretName}/versions/latest`;
    
    // Access the secret version
    const [version] = await client.accessSecretVersion({
      name: name,
    });

    // Verify that the secret payload exists
    if (!version.payload?.data) {
      throw new Error(`Secret '${secretName}' not found or has empty payload`);
    }

    console.log(`Secret '${secretName}' récupéré avec succès`);
    return version.payload.data.toString();
  } catch (error) {
    console.error(`Erreur d'accès au secret '${secretName}':`, error);
    
    // Fallback pour les environnements de développement
    if (process.env.NODE_ENV === 'development' || process.env.FUNCTIONS_EMULATOR === 'true') {
      console.log('Environnement de développement détecté, utilisation de la variable d\'environnement');
      const envVar = secretName.toUpperCase().replace(/-/g, '_');
      const envValue = process.env[envVar];
      
      if (envValue) {
        console.log(`Utilisation de la variable d'environnement ${envVar} comme fallback`);
        return envValue;
      }
    }
    
    throw new Error(`Impossible d'accéder au secret '${secretName}'. Vérifiez les permissions du compte de service.`);
  }
};
