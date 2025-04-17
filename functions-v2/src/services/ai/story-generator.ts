
import { openai, initializeOpenAI } from './openai-client';
import { getStorySystemPrompt, getStoryUserPrompt } from './story-prompt';
import { formatStoryData } from './story-formatting';

export const generateStoryWithAI = async (objective: string, childrenNames: string[]) => {
  console.log("Début de la génération avec OpenAI");
  
  if (!objective || typeof objective !== 'string' || !objective.trim()) {
    throw new Error("L'objectif de l'histoire ne peut pas être vide");
  }
  
  if (!Array.isArray(childrenNames) || childrenNames.length === 0) {
    throw new Error("Au moins un nom d'enfant doit être fourni");
  }
  
  try {
    await initializeOpenAI();
    
    const systemPrompt = getStorySystemPrompt();
    const userPrompt = getStoryUserPrompt(childrenNames, objective);
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    // Utilisation d'une chaîne vide comme valeur par défaut
    const storyContent = completion.choices[0]?.message?.content || "";
    if (!storyContent.trim()) {
      throw new Error("Aucun contenu généré par OpenAI");
    }

    return formatStoryData(storyContent, childrenNames, objective);
  } catch (error) {
    console.error("Erreur lors de la génération de l'histoire:", error);
    throw new Error(`Erreur de génération: ${error instanceof Error ? error.message : String(error)}`);
  }
};
