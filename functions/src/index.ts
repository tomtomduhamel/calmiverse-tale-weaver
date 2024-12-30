import * as functions from 'firebase-functions';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const generateStory = functions.https.onCall(async (data, context) => {
  try {
    if (!data.prompt) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Le prompt est requis'
      );
    }

    console.log('Generating story with prompt:', data.prompt);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'Tu es un expert en création d\'histoires pour enfants.',
        },
        {
          role: 'user',
          content: data.prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });

    const story = completion.choices[0].message.content;
    if (!story) {
      throw new functions.https.HttpsError(
        'internal',
        'Aucune histoire n\'a été générée'
      );
    }

    // Génération d'un id_stories unique
    const uniqueId = `story_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Formatage des données pour Firestore
    const storyData = {
      id_stories: uniqueId, // Ajout de l'id_stories unique
      story_text: story,
      story_summary: "Résumé en cours de génération...",
      status: 'pending',
      createdAt: new Date(),
      title: "Nouvelle histoire",
      preview: story.substring(0, 200) + "..."
    };

    console.log('Story data formatted for Firestore:', JSON.stringify(storyData));
    return storyData;

  } catch (error) {
    console.error('Error generating story:', error);
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    if (error instanceof Error) {
      throw new functions.https.HttpsError('internal', error.message);
    }

    throw new functions.https.HttpsError('internal', 'Une erreur inconnue est survenue');
  }
});