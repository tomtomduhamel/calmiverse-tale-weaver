
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
      throw new Error('Google Cloud project ID not available in environment');
    }
    
    console.log(`Attempting to access secret '${secretName}' from project '${projectId}'`);
    
    const name = `projects/${projectId}/secrets/${secretName}/versions/latest`;
    
    // Access the secret version
    const [version] = await client.accessSecretVersion({
      name: name,
    });

    // Verify that the secret payload exists
    if (!version.payload?.data) {
      throw new Error(`Secret '${secretName}' not found or has empty payload`);
    }

    console.log(`Successfully retrieved secret '${secretName}'`);
    return version.payload.data.toString();
  } catch (error: any) {
    console.error(`Error accessing secret '${secretName}':`, error);
    
    // Create a detailed error message with troubleshooting hints
    let errorMessage = `Failed to access secret '${secretName}'`;
    
    if (error.code) {
      errorMessage += ` (Error code: ${error.code})`;
    }
    
    // Add specific guidance based on common errors
    if (error.message?.includes('Permission denied')) {
      errorMessage += '. Check IAM permissions for the service account.';
    } else if (error.message?.includes('not found')) {
      errorMessage += '. Verify the secret exists in Secret Manager.';
    }
    
    throw new Error(errorMessage);
  }
};
