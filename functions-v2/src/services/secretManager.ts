
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

const client = new SecretManagerServiceClient();

export const getSecret = async (secretName: string): Promise<string> => {
  try {
    const projectId = process.env.GCLOUD_PROJECT;
    const name = `projects/${projectId}/secrets/${secretName}/versions/latest`;
    
    console.log(`Attempting to access secret: ${secretName}`);
    
    const [version] = await client.accessSecretVersion({
      name: name,
    });

    if (!version.payload?.data) {
      throw new Error(`Secret ${secretName} not found or empty`);
    }

    return version.payload.data.toString();
  } catch (error) {
    console.error(`Error accessing secret ${secretName}:`, error);
    throw new Error(`Failed to access secret ${secretName}`);
  }
};

