
import { openai, initializeOpenAI } from './openai-client';
import { getStorySystemPrompt, getStoryUserPrompt } from './story-prompt';
import { formatStoryData } from './story-formatting';

/**
 * Génère une histoire en utilisant l'API OpenAI
 */
export const generateStoryWithAI = async (objective: string, childrenNames: string[]) => {
  console.log("Début de la génération avec OpenAI");
  console.log("Paramètres reçus:", { objective, childrenNames });
  
  try {
    // S'assurer que la clé API est initialisée
    await initializeOpenAI();
    
    console.log("Client OpenAI initialisé avec succès");
    console.log("Création de la requête OpenAI");
    
    const systemPrompt = getStorySystemPrompt();
    const userPrompt = getStoryUserPrompt(childrenNames, objective);
    
    // Vérifier que l'objectif et les noms d'enfants sont valides
    if (!objective || objective.trim() === '') {
      throw new Error("L'objectif de l'histoire ne peut pas être vide");
    }
    
    if (!childrenNames || !Array.isArray(childrenNames) || childrenNames.length === 0) {
      throw new Error("Au moins un nom d'enfant doit être fourni");
    }
    
    console.log("Envoi de la requête à OpenAI");
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
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

    console.log("Formatage des données de l'histoire");
    
    // Formater et retourner les données de l'histoire
    const formattedStory = formatStoryData(story, childrenNames, objective);
    
    console.log("Histoire générée avec succès:", {
      title: formattedStory.title,
      id: formattedStory.id_stories,
      length: formattedStory.story_text?.length || 0
    });
    
    return formattedStory;
  } catch (error) {
    console.error("Erreur lors de la génération de l'histoire avec OpenAI:", error);
    
    // Créer un message d'erreur plus descriptif
    const errorMessage = error instanceof Error 
      ? `Erreur de génération: ${error.message}` 
      : "Erreur inconnue lors de la génération de l'histoire";
      
    console.error(errorMessage);
    throw new Error(errorMessage);
  }
};
