import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import OpenAI from 'openai';
import cors from 'cors';

admin.initializeApp();
const storage = admin.storage();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Configuration unique de CORS
const corsHandler = cors({
  origin: true,
  methods: ['POST', 'OPTIONS', 'GET'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
  maxAge: 3600
});

export const uploadEpub = functions.https.onRequest((request, response) => {
  return corsHandler(request, response, async () => {
    try {
      console.log('Début de la fonction uploadEpub');
      
      if (request.method !== 'POST') {
        console.error('Méthode non autorisée:', request.method);
        throw new functions.https.HttpsError('invalid-argument', 'Method not allowed');
      }

      console.log('Vérification du contenu de la requête');
      const { content, filename } = request.body;
      if (!content || !filename) {
        console.error('Contenu manquant:', { hasContent: !!content, hasFilename: !!filename });
        throw new functions.https.HttpsError('invalid-argument', 'Content and filename are required');
      }

      console.log('Création du buffer à partir du contenu HTML');
      const buffer = Buffer.from(content);

      console.log('Création de la référence Storage pour:', filename);
      const bucket = storage.bucket();
      const file = bucket.file(`epubs/${filename}`);

      console.log('Début de l\'upload du fichier');
      await file.save(buffer, {
        metadata: {
          contentType: 'application/epub+zip'
        }
      });
      console.log('Fichier uploadé avec succès');

      console.log('Génération de l\'URL signée');
      const [url] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000
      });
      console.log('URL générée avec succès:', url);

      response.json({ url });
    } catch (error) {
      console.error('Erreur détaillée dans uploadEpub:', error);
      if (error instanceof Error) {
        console.error('Stack trace:', error.stack);
      }
      
      if (error instanceof functions.https.HttpsError) {
        response.status(400).json({ 
          error: error.message,
          code: error.code,
          details: error.details 
        });
      } else {
        response.status(500).json({ 
          error: 'Failed to upload file',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  });
});

export const generateStory = functions.https.onRequest((request, response) => {
  return corsHandler(request, response, async () => {
    if (request.method === 'OPTIONS') {
      response.status(204).send('');
      return;
    }

    try {
      if (!request.body.data?.prompt) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Le prompt est requis'
        );
      }

      console.log('Generating story with prompt:', request.body.data.prompt);

      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `Tu es un expert en création d'histoires pour enfants.

FORMAT DE L'HISTOIRE :
- Titre : [Titre accrocheur et adapté à l'âge]
- Longueur : 800-1000 mots
- Structure :
  * Introduction (situation et personnages)
  * Événement déclencheur
  * 2-3 péripéties maximum
  * Résolution
  * Conclusion avec message positif

RÈGLES FONDAMENTALES :
- Adapte le langage à l'âge de l'enfant
- Crée des personnages mémorables
- Utilise des dialogues engageants
- Ajoute des répétitions pour les jeunes enfants
- Évite tout contenu effrayant ou angoissant
- Termine toujours sur une note positive

ADAPTATION SELON L'OBJECTIF :
- Pour dormir :
  * Rythme lent et apaisant
  * Images douces et calmes
  * Évite l'excitation
- Pour apprendre :
  * Focus sur un concept précis
  * Exemples concrets
  * Messages éducatifs subtils
- Pour s'amuser :
  * Rythme dynamique
  * Touches d'humour
  * Petites surprises amusantes
- Pour se détendre :
  * Aventures douces
  * Résolution positive des conflits
  * Moments de calme`,
          },
          {
            role: 'user',
            content: request.body.data.prompt,
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

      const uniqueId = `story_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const storyData = {
        id_stories: uniqueId,
        story_text: story,
        story_summary: "Résumé en cours de génération...",
        status: 'pending',
        createdAt: new Date(),
        title: "Nouvelle histoire",
        preview: story.substring(0, 200) + "..."
      };

      console.log('Story data formatted:', JSON.stringify(storyData));
      
      response.json({ data: storyData });

    } catch (error) {
      console.error('Error generating story:', error);
      
      if (error instanceof functions.https.HttpsError) {
        response.status(400).json({ 
          error: error.message,
          code: error.code,
          details: error.details 
        });
      } else {
        response.status(500).json({ 
          error: 'Failed to generate story',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  });
});