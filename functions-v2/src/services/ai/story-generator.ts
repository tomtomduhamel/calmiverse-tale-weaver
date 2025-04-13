
import { openai, initializeOpenAI } from './openai-client';
import { getStorySystemPrompt, getStoryUserPrompt } from './story-prompt';
import { formatStoryData } from './story-formatting';

/**
 * Generates a story using OpenAI's API
 */
export const generateStoryWithAI = async (objective: string, childrenNames: string[]) => {
  console.log("Début de la génération avec OpenAI");
  console.log("Paramètres reçus:", { objective, childrenNames });
  
  try {
    // Ensure the API key is initialized
    await initializeOpenAI();
    
    console.log("OpenAI client initialisé avec succès");
    console.log("Création de la requête OpenAI");
    
    const systemPrompt = getStorySystemPrompt();
    const userPrompt = getStoryUserPrompt(childrenNames, objective);
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o', // Utiliser gpt-4o
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: userPrompt
        },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    console.log("Réponse d'OpenAI reçue");
    
    const story = completion.choices[0].message.content;
    if (!story) {
      console.error("Erreur: Aucune histoire générée par OpenAI");
      throw new Error('Aucune histoire n\'a été générée');
    }

    // Format and return the story data
    return formatStoryData(story, childrenNames, objective);
  } catch (error: any) {
    console.error("Erreur lors de la génération de l'histoire avec OpenAI:", error);
    throw error;
  }
};
