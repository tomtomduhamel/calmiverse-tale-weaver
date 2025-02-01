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
      const { objective, childrenNames } = request.body.data;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `Tu es un expert en création d'histoires pour enfants.

FORMAT DE L'HISTOIRE :
- Longueur : 6000-10000 mots
- Structure narrative fluide et continue, sans découpage visible
- Pas de titre explicite

RÈGLES FONDAMENTALES :
- Adapte le langage à l'âge de l'enfant
- Crée des personnages mémorables et appropriés
- Utilise des dialogues engageants
- Ajoute des répétitions pour les jeunes enfants
- Évite tout contenu effrayant ou angoissant
- Termine toujours sur une note positive

STRUCTURE CACHÉE (ne pas la rendre visible) :
1. Introduction et mise en contexte :
   - Cadre sécurisant et familier
   - Personnages principaux introduits naturellement
   - Description sensorielle de l'environnement
   - Transition douce

2. Développement de l'ambiance :
   - Descriptions sensorielles riches
   - Éléments naturels ou fantastiques
   - Ton calme et rassurant
   - Métaphores apaisantes

3. Progression de l'histoire :
   - Langage indirect et suggestions positives
   - Introduction de compagnons bienveillants
   - Symboles rassurants
   - Progression naturelle

4. Cœur de l'histoire :
   - Aventure captivante mais apaisante
   - Descriptions immersives
   - Rencontres positives
   - Rythme lent et régulier

5. Conclusion :
   - Renforcement du sentiment de sécurité
   - Phrases rassurantes
   - Transition douce vers l'objectif
   - Message final positif

CONTRAINTES SPÉCIFIQUES :
- Vocabulaire simple et accessible
- Pas de termes liés à l'hypnose
- Grammaire et orthographe impeccables
- Éviter l'excès de superlatifs
- Noms de personnages appropriés
- Univers cohérent et captivant`,
          },
          {
            role: 'user',
            content: `Je souhaite créer une histoire personnalisée pour ${childrenNames} avec l'objectif suivant : ${objective}. 
            L'histoire doit suivre la structure donnée tout en restant fluide et naturelle, sans découpage visible en parties.
            Assure-toi que l'histoire soit captivante dès le début pour maintenir l'attention des enfants.`,
          },
        ],
        temperature: 0.7,
        max_tokens: 4000,
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