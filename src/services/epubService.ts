import { getFunctions, httpsCallable } from 'firebase/functions';
import type { Story } from '@/types/story';

export const generateAndUploadEpub = async (story: Story): Promise<string> => {
  try {
    console.log("Début de la génération de l'EPUB pour l'histoire:", story.title);
    
    // Créer le contenu HTML brut
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${story.title}</title>
        </head>
        <body>
          <h1>${story.title}</h1>
          ${story.story_text.split('\n').map(p => `<p>${p}</p>`).join('')}
        </body>
      </html>
    `;

    const filename = `${story.id}_${Date.now()}.epub`;

    // Appeler la Cloud Function pour l'upload
    const functions = getFunctions();
    const uploadEpubFn = httpsCallable(functions, 'uploadEpub');
    const result = await uploadEpubFn({ content: htmlContent, filename });

    // @ts-ignore - nous savons que result.data contient url
    const { url } = result.data;
    
    console.log("EPUB généré et uploadé avec succès:", url);
    return url;
  } catch (error) {
    console.error("Erreur lors de la génération de l'EPUB:", error);
    throw error;
  }
};