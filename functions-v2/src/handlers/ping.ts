
import { onCall } from 'firebase-functions/v2/https';
import { initializeOpenAI, openai } from '../services/ai/openai-client';

/**
 * Fonction ping simple pour tester la connectivité des Firebase Functions
 * et vérifier l'accès aux services externes comme OpenAI
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
      environment: process.env.NODE_ENV || 'production',
      message: 'Service disponible',
      services: {
        openai: false
      },
      config: {
        projectId: process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT || 'non défini',
        hasOpenAiKey: !!process.env.OPENAI_API_KEY,
        region: process.env.FUNCTION_REGION || 'us-central1'
      }
    };
    
    // Tester OpenAI
    try {
      await initializeOpenAI();
      
      // Faire un appel simple à OpenAI
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Test de connectivité' }],
        max_tokens: 5
      });
      
      result.services.openai = true;
      console.log("Test OpenAI réussi:", response.choices[0]?.message?.content);
    } catch (error) {
      console.error('Erreur lors du test OpenAI:', error);
      result.services.openai = false;
      result.openaiError = error instanceof Error ? error.message : 'Erreur inconnue';
    }
    
    console.log('Résultat du ping:', JSON.stringify(result, null, 2));
    return result;
  }
);
