import OpenAI from 'openai';
import { type CloudFunctionStory } from '../types/shared/story';

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000;
const MAX_TOKENS = 4096; // Réduit de 8192 à 4096 pour plus de stabilité

interface GenerationMetrics {
  startTime: number;
  endTime?: number;
  retryCount: number;
  wordCount: number;
  modelUsed: string;
  tokensUsed?: number;
}

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const generateStoryWithAI = async (
  objective: string, 
  childrenNames: string[], 
  apiKey: string
): Promise<CloudFunctionStory> => {
  const metrics: GenerationMetrics = {
    startTime: Date.now(),
    retryCount: 0,
    wordCount: 0,
    modelUsed: 'gpt-4-turbo-preview'
  };

  console.log("Starting story generation with parameters:", {
    objective,
    childrenNames,
    hasApiKey: !!apiKey,
    model: metrics.modelUsed,
    maxTokens: MAX_TOKENS,
    timestamp: new Date().toISOString()
  });
  
  try {
    if (!apiKey) {
      console.error("OpenAI API key validation failed at:", new Date().toISOString());
      throw new Error("La clé API OpenAI est requise");
    }

    // Validation de clé API assouplie pour supporter les nouveaux formats
    if (!apiKey.startsWith('sk-')) {
      console.error("Invalid OpenAI API key format");
      throw new Error("Format de la clé API OpenAI invalide");
    }

    console.log("Initializing OpenAI client at:", new Date().toISOString());
    const openai = new OpenAI({ apiKey });

    let lastError: Error | null = null;
    let generatedText: string | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        console.log(`Attempt ${attempt + 1}/${MAX_RETRIES} starting at:`, new Date().toISOString());
        
        const completion = await openai.chat.completions.create({
          model: 'gpt-4-turbo-preview',
          messages: [
            {
              role: 'system',
              content: `Tu es un expert en création d'histoires pour enfants.

FORMAT DE L'HISTOIRE :
- Longueur : Entre 2000-3000 mots pour commencer (environ 2-3 minutes de lecture)
- Structure narrative fluide et continue
- Pas de titre explicite
- Descriptions détaillées et immersives
- Dialogues naturels entre les personnages

RÈGLES FONDAMENTALES :
- Adapte le langage à l'âge de l'enfant
- Crée des personnages mémorables
- Utilise des dialogues engageants
- Ajoute des répétitions stratégiques pour les jeunes enfants
- Évite tout contenu effrayant
- Termine sur une note positive
- Enrichis avec des détails sensoriels
- Développe les relations entre les personnages

IMPORTANT :
- NE PAS inclure de découpage en chapitres
- NE PAS inclure de titre au début
- Commencer directement avec l'histoire`,
            },
            {
              role: 'user',
              content: `Je souhaite créer une histoire personnalisée pour ${childrenNames.join(', ')} avec l'objectif suivant : ${objective}. 
              L'histoire doit être écrite dans un langage adapté aux enfants.
              Assure-toi que l'histoire soit captivante dès le début.
              IMPORTANT : L'histoire doit faire entre 2000 et 3000 mots pour cette première version.`,
            },
          ],
          temperature: 0.7,
          max_tokens: MAX_TOKENS,
          frequency_penalty: 0.3,
          presence_penalty: 0.2,
          top_p: 0.95,
        });

        if (!completion.choices[0]?.message?.content) {
          throw new Error("Réponse OpenAI invalide ou vide");
        }

        generatedText = completion.choices[0].message.content.trim();
        
        if (generatedText.toLowerCase().includes('chapitre') || 
            generatedText.split('\n')[0].toLowerCase().includes('titre')) {
          throw new Error("Le format de l'histoire ne respecte pas les consignes");
        }

        metrics.tokensUsed = completion.usage?.total_tokens;
        metrics.retryCount = attempt;
        
        console.log("Story generation successful:", {
          tokensUsed: metrics.tokensUsed,
          wordCount: generatedText.split(/\s+/).length,
          attempt: attempt + 1,
          timestamp: new Date().toISOString()
        });
        
        break;
      } catch (error) {
        lastError = error as Error;
        console.error(`Attempt ${attempt + 1} failed:`, {
          error: error instanceof Error ? error.message : 'Unknown error',
          type: error instanceof OpenAI.APIError ? error.type : 'Unknown type',
          status: error instanceof OpenAI.APIError ? error.status : 'Unknown status',
          timestamp: new Date().toISOString()
        });
        
        if (error instanceof OpenAI.APIError) {
          if (error.status === 401) throw error;
          if (error.status === 429) {
            const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt);
            console.log(`Rate limited. Waiting ${delay}ms before retry at:`, new Date().toISOString());
            await wait(delay);
          }
        }
        
        if (attempt === MAX_RETRIES - 1) {
          console.error("All retry attempts failed:", {
            lastError: lastError?.message,
            retryCount: attempt + 1,
            timestamp: new Date().toISOString()
          });
          throw lastError;
        }
      }
    }
    
    if (!generatedText) {
      console.error("Error: No story content generated after all retries");
      throw new Error('Aucune histoire n\'a été générée après plusieurs tentatives');
    }

    const wordCount = generatedText.split(/\s+/).length;
    metrics.wordCount = wordCount;
    metrics.endTime = Date.now();
    
    console.log("Generation metrics:", {
      ...metrics,
      duration: `${(metrics.endTime - metrics.startTime) / 1000}s`,
      wordCount,
      timestamp: new Date().toISOString()
    });

    if (wordCount < 2000 || wordCount > 3000) {
      console.warn("Warning: Story length outside target range:", {
        wordCount,
        targetMin: 2000,
        targetMax: 3000,
        timestamp: new Date().toISOString()
      });
    }

    const uniqueId = `story_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const storyData: CloudFunctionStory = {
      id: uniqueId,
      title: `Histoire pour ${childrenNames.join(' et ')}`,
      preview: generatedText.substring(0, 200) + "...",
      objective,
      childrenIds: [],
      childrenNames,
      story_text: generatedText,
      story_summary: "Résumé en cours de génération...",
      createdAt: new Date().toISOString(),
      status: 'pending',
      authorId: '',
      wordCount,
      _version: 1,
      _lastSync: new Date().toISOString(),
      _pendingWrites: true,
      retryCount: metrics.retryCount,
      processingTime: metrics.endTime - metrics.startTime
    };

    console.log("Story generation completed successfully:", {
      id: storyData.id,
      wordCount: storyData.wordCount,
      status: storyData.status,
      processingTime: `${storyData.processingTime}ms`,
      retryCount: storyData.retryCount,
      timestamp: new Date().toISOString()
    });
    
    return storyData;
  } catch (error) {
    metrics.endTime = Date.now();
    console.error("Error during story generation:", {
      error: error instanceof Error ? {
        message: error.message,
        name: error.name,
        stack: error.stack
      } : 'Unknown error',
      metrics,
      timestamp: new Date().toISOString()
    });
    
    if (error instanceof OpenAI.APIError) {
      console.error("OpenAI API Error details:", {
        status: error.status,
        type: error.type,
        code: error.code,
        param: error.param,
        timestamp: new Date().toISOString()
      });
      
      if (error.status === 401) {
        throw new Error("La clé API OpenAI est invalide");
      } else if (error.status === 429) {
        throw new Error("Limite de requêtes OpenAI atteinte. Veuillez réessayer dans quelques minutes");
      } else if (error.status === 500) {
        throw new Error("Erreur du service OpenAI. Veuillez réessayer");
      }
      
      throw new Error(`Erreur OpenAI: ${error.message}`);
    }
    
    throw error;
  }
};
