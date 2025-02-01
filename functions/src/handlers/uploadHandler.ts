import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { corsHandler } from '../middleware/cors';

const storage = admin.storage();

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