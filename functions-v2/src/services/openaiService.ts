
import OpenAI from 'openai';
import * as admin from 'firebase-admin';
import { getSecret } from './secretManager';

// Initialize OpenAI client with API key from Secret Manager
const initializeOpenAI = async (): Promise<OpenAI> => {
  try {
    console.log('Retrieving OpenAI API key from Secret Manager');
    const apiKey = await getSecret('OPENAI_API_KEY');
    
    if (!apiKey) {
      throw new Error('API key not found in Secret Manager');
    }
    
    console.log('OpenAI API key retrieved successfully');
    return new OpenAI({
      apiKey: apiKey
    });
  } catch (error) {
    console.error('Failed to initialize OpenAI client:', error);
    throw new Error('Failed to initialize OpenAI client. Check Secret Manager configuration.');
  }
};

export const generateStoryWithAI = async (objective: string, childrenNames: string[]) => {
  console.log('Starting OpenAI story generation process');
  console.log('Parameters received:', { objective, childrenNames });
  console.log('Validating input parameters');
  
  // Input validation
  if (!objective || objective.trim() === '') {
    throw new Error('Objective is required');
  }
  
  if (!Array.isArray(childrenNames) || childrenNames.length === 0) {
    throw new Error('At least one child name is required');
  }
  
  try {
    console.log('Initializing OpenAI client');
    const openai = await initializeOpenAI();
    
    const childrenNamesString = childrenNames.join(', ');
    console.log(`Creating story for children: ${childrenNamesString}`);
    console.log(`Story objective: ${objective}`);
    
    console.log('Sending request to OpenAI');
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Tu es un conteur d'histoires pour enfants expérimenté. Ta mission est de créer des histoires captivantes, 
          éducatives et adaptées aux enfants. Les histoires doivent être structurées avec un début, un milieu et une fin claire.
          Utilise un langage simple mais riche, avec des mots adaptés au niveau des enfants.
          Crée des personnages mémorables, y compris les enfants mentionnés dans la demande.
          Inclus des dialogues engageants et des descriptions vivantes.
          L'histoire doit promouvoir des valeurs positives comme l'amitié, le courage, la gentillesse.
          Évite tout contenu effrayant, violent ou inapproprié pour les enfants.
          L'histoire doit avoir une longueur d'environ 1000-1500 mots, avec des paragraphes courts.
          Assure-toi que l'histoire répond spécifiquement à l'objectif donné (relaxation, sommeil, etc.).
          
          Tu dois générer une histoire structurée avec:
          1. Un titre accrocheur
          2. Une histoire complète
          3. Un résumé court de l'histoire (50-100 mots maximum)
          
          Format de sortie (JSON):
          ```json
          {
            "title": "Le titre de l'histoire",
            "story_text": "Le texte complet de l'histoire...",
            "summary": "Un bref résumé de l'histoire..."
          }
          ```
          
          N'inclus rien d'autre que ce JSON dans ta réponse.`
        },
        {
          role: "user",
          content: `Crée une histoire pour les enfants suivants: ${childrenNamesString}. L'objectif de l'histoire est: ${objective}.
           
          Assure-toi que ces enfants sont les personnages principaux de l'histoire.
          
          Réponds UNIQUEMENT avec le JSON contenant le titre, l'histoire complète et le résumé.`
        }
      ],
      temperature: 0.7,
      max_tokens: 4000,
      response_format: { type: "json_object" }
    });
    
    console.log('Received response from OpenAI');
    console.log('Response status:', response.choices[0].finish_reason);
    
    const story = response.choices[0].message.content;
    if (!story) {
      console.error('OpenAI returned empty response');
      throw new Error('La génération de l\'histoire a échoué: réponse vide');
    }
    
    console.log('Parsing JSON response');
    let parsedStory;
    try {
      parsedStory = JSON.parse(story);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', parseError);
      console.error('Raw response:', story);
      throw new Error('La réponse du service de génération n\'est pas dans un format valide');
    }
    
    // Validate the structure of the response
    if (!parsedStory.title || !parsedStory.story_text || !parsedStory.summary) {
      console.error('Malformed OpenAI response - missing required fields');
      console.error('Parsed response:', parsedStory);
      throw new Error('La réponse du service de génération est incomplète');
    }
    
    console.log('Successfully parsed story data');
    console.log('Story title:', parsedStory.title);
    console.log('Story summary length:', parsedStory.summary.length);
    console.log('Story text length:', parsedStory.story_text.length);
    
    // Generate a unique ID for the story
    const storyId = `story_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    console.log('Preparing final story object structure');
    const storyData = {
      id_stories: storyId,
      title: parsedStory.title,
      story_text: parsedStory.story_text,
      story_summary: parsedStory.summary,
      status: 'completed',
      createdAt: new Date(),
      preview: parsedStory.story_text.substring(0, 200) + '...'
    };
    
    console.log('Story generation completed successfully');
    return storyData;
    
  } catch (error) {
    console.error('Error during story generation:', error);
    
    // Check if it's an OpenAI API error
    if (error.response) {
      console.error('OpenAI API error:', {
        status: error.response.status,
        data: error.response.data
      });
      throw new Error(`Erreur lors de la génération: ${error.response.data?.error?.message || 'Erreur du service OpenAI'}`);
    }
    
    // Rethrow with a user-friendly message
    throw new Error(`La génération de l'histoire a échoué: ${error.message || 'Erreur inconnue'}`);
  }
};
