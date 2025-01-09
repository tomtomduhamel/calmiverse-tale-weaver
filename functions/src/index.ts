import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import OpenAI from 'openai';
import cors from 'cors';

admin.initializeApp();
const storage = admin.storage();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const corsHandler = cors({ origin: true });

export const uploadEpub = functions.https.onRequest((request, response) => {
  corsHandler(request, response, async () => {
    try {
      if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method not allowed' });
      }

      const { content, filename } = request.body;
      if (!content || !filename) {
        return response.status(400).json({ error: 'Content and filename are required' });
      }

      // Créer un buffer à partir du contenu HTML brut
      const buffer = Buffer.from(content);

      // Créer une référence au fichier dans Firebase Storage
      const bucket = storage.bucket();
      const file = bucket.file(`epubs/${filename}`);

      // Upload le fichier
      await file.save(buffer, {
        metadata: {
          contentType: 'application/epub+zip'
        }
      });

      // Générer une URL de téléchargement
      const [url] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000 // URL valide 7 jours
      });

      response.json({ url });
    } catch (error) {
      console.error('Error uploading epub:', error);
      response.status(500).json({ error: 'Failed to upload file' });
    }
  });
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