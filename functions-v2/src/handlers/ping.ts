
import { onCall } from 'firebase-functions/v2/https';
import { initializeOpenAI, openai } from '../services/ai/openai-client';

/**
 * Fonction ping simple pour tester la connectivité des Firebase Functions
 * et vérifier l'accès aux services externes comme Secret Manager et OpenAI
 */
export const ping = onCall(
  { 
    timeoutSeconds: 30,
    memory: '256MiB',
  }, 
  async (request) => {
    console.log('Fonction ping appelée');
    
    const result = {
      success: true,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      message: 'Service disponible',
      services: {
        openai: false,
        secretManager: false
      },
      projectId: process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT || 'non défini'
    };
    
    // Tester OpenAI
    try {
      await initializeOpenAI();
      // Faire un simple appel pour vérifier que la clé fonctionne
      await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Test de connectivité' }],
        max_tokens: 5
      });
      result.services.openai = true;
    } catch (error) {
      console.error('Erreur lors du test OpenAI:', error);
      result.services.openai = false;
      result.openaiError = error instanceof Error ? error.message : 'Erreur inconnue';
    }
    
    // Récupérer les variables d'environnement disponibles (version sécurisée)
    const safeEnvVars = {
      GOOGLE_CLOUD_PROJECT: process.env.GOOGLE_CLOUD_PROJECT || undefined,
      GCLOUD_PROJECT: process.env.GCLOUD_PROJECT || undefined,
      NODE_ENV: process.env.NODE_ENV || undefined,
      FUNCTIONS_EMULATOR: process.env.FUNCTIONS_EMULATOR || undefined,
      FUNCTION_TARGET: process.env.FUNCTION_TARGET || undefined,
      FUNCTION_SIGNATURE_TYPE: process.env.FUNCTION_SIGNATURE_TYPE || undefined,
      HAS_OPENAI_KEY: !!process.env.OPENAI_API_KEY
    };
    
    result.environment_info = safeEnvVars;
    
    return result;
  }
);
