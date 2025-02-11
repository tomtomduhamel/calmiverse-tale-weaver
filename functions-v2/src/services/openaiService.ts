
import OpenAI from 'openai';
import { type CloudFunctionStory } from '../../src/types/shared/story';

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000;
const MAX_TOKENS = 4000;

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
    modelUsed: 'gpt-4o-mini'
  };

  console.log("Starting OpenAI story generation with parameters:", {
    objective,
    childrenNames,
    hasApiKey: !!apiKey,
    timestamp: new Date().toISOString()
  });
  
  try {
    if (!apiKey) {
      console.error("OpenAI API key validation failed at:", new Date().toISOString());
      throw new Error("La clé API OpenAI est requise");
    }

    if (!/^sk-[a-zA-Z0-9]{32,}$/.test(apiKey)) {
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
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `Tu es un expert en création d'histoires pour enfants.

FORMAT DE L'HISTOIRE :
- Longueur : IMPÉRATIF de faire entre 10000-15000 mots (environ 6-8 minutes de lecture)
- Structure narrative fluide et continue, sans découpage visible
- Pas de titre explicite
- Descriptions détaillées et immersives
- Dialogues riches et naturels entre les personnages

RÈGLES FONDAMENTALES :
- Adapte le langage à l'âge de l'enfant
- Crée des personnages mémorables avec des personnalités distinctes
- Utilise des dialogues engageants et naturels
- Ajoute des répétitions stratégiques pour les jeunes enfants
- Évite tout contenu effrayant ou angoissant
- Termine toujours sur une note positive
- Enrichis l'histoire avec des détails sensoriels
- Développe les relations entre les personnages`,
            },
            {
              role: 'user',
              content: `Je souhaite créer une histoire personnalisée pour ${childrenNames.join(', ')} avec l'objectif suivant : ${objective}. 
              L'histoire doit suivre la structure donnée tout en restant fluide et naturelle, sans découpage visible en parties.
              Assure-toi que l'histoire soit captivante dès le début pour maintenir l'attention des enfants.
              IMPORTANT : L'histoire doit faire entre 10000 et 15000 mots.`,
            },
          ],
          temperature: 0.8,
          max_tokens: MAX_TOKENS,
          frequency_penalty: 0.2,
          presence_penalty: 0.1,
        });

        if (!completion.choices[0]?.message?.content) {
          throw new Error("Réponse OpenAI invalide ou vide");
        }

        generatedText = completion.choices[0].message.content;
        metrics.tokensUsed = completion.usage?.total_tokens;
        metrics.retryCount = attempt;
        break;
      } catch (error) {
        lastError = error as Error;
        console.error(`Attempt ${attempt + 1} failed:`, {
          error: error instanceof Error ? error.message : 'Unknown error',
          type: error instanceof OpenAI.APIError ? error.type : 'Unknown type',
          status: error instanceof OpenAI.APIError ? error.status : 'Unknown status'
        });
        
        if (error instanceof OpenAI.APIError) {
          if (error.status === 401) throw error; // Don't retry auth errors
          if (error.status === 429) {
            const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt);
            console.log(`Rate limited. Waiting ${delay}ms before retry`);
            await wait(delay);
          }
        }
        
        if (attempt === MAX_RETRIES - 1) throw lastError;
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
      timestamp: new Date().toISOString()
    });

    if (wordCount < 10000) {
      console.warn("Warning: Story is shorter than expected minimum length");
    }

    console.log("Generating story data");
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
      retryCount: storyData.retryCount
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
        param: error.param
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
