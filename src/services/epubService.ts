
import { getFunctions, httpsCallable } from 'firebase/functions';
import type { Story } from '@/types/story';

export const generateAndUploadEpub = async (story: Story): Promise<string> => {
  try {
    console.log("Début de la génération de l'EPUB pour l'histoire:", story.title);
    
    // Create clean HTML content
    const sanitizedTitle = story.title.replace(/[<>&]/g, '');
    const sanitizedText = story.story_text
      .replace(/[<>&]/g, '')
      .split('\n')
      .map(p => p.trim())
      .filter(p => p.length > 0)
      .map(p => `<p>${p}</p>`)
      .join('');
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${sanitizedTitle}</title>
          <meta charset="utf-8">
        </head>
        <body>
          <h1>${sanitizedTitle}</h1>
          ${sanitizedText}
        </body>
      </html>
    `;

    const filename = `${story.id}_${Date.now()}.epub`;

    // Call Cloud Function for upload
    const functions = getFunctions();
    const uploadEpubFn = httpsCallable(functions, 'uploadEpub');
    const result = await uploadEpubFn({ content: htmlContent, filename });

    // @ts-ignore - we know result.data contains url
    const { url } = result.data;
    
    console.log("EPUB généré et uploadé avec succès:", url);
    return url;
  } catch (error) {
    console.error("Erreur lors de la génération de l'EPUB:", error);
    throw error;
  }
};
