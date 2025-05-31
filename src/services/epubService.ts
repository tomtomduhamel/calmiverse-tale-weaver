
import { supabase } from '@/integrations/supabase/client';
import type { Story } from '@/types/story';

export const generateAndUploadEpub = async (story: Story): Promise<string> => {
  try {
    console.log("🔧 Début de la génération de l'EPUB pour l'histoire:", story.title);
    
    // Nettoyer et formater le contenu HTML
    const sanitizedTitle = story.title.replace(/[<>&"]/g, '');
    const sanitizedText = story.story_text
      .replace(/[<>&"]/g, '')
      .split('\n')
      .map(p => p.trim())
      .filter(p => p.length > 0)
      .map(p => `<p style="margin-bottom: 15px; line-height: 1.6;">${p}</p>`)
      .join('');
    
    const htmlContent = `
      <!DOCTYPE html>
      <html xmlns="http://www.w3.org/1999/xhtml">
        <head>
          <title>${sanitizedTitle}</title>
          <meta charset="utf-8"/>
          <style>
            body { font-family: Georgia, serif; font-size: 16px; line-height: 1.6; margin: 20px; }
            h1 { text-align: center; font-size: 2em; margin-bottom: 30px; }
            .title-page { text-align: center; page-break-after: always; padding: 50px 0; }
            .objective { font-style: italic; margin: 20px 0; color: #666; }
            .dedication { margin: 20px 0; font-weight: bold; }
          </style>
        </head>
        <body>
          ${sanitizedText}
        </body>
      </html>
    `;

    const filename = `${sanitizedTitle.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_')}_${Date.now()}`;

    console.log("📤 Appel de la fonction Edge upload-epub...");

    // Appel à la fonction Edge Supabase
    const { data, error } = await supabase.functions.invoke('upload-epub', {
      body: { content: htmlContent, filename }
    });

    if (error) {
      console.error("❌ Erreur fonction Edge:", error);
      throw new Error(`Erreur lors de la génération EPUB: ${error.message}`);
    }
    
    if (!data?.url) {
      console.error("❌ Pas d'URL retournée par la fonction Edge");
      throw new Error("Aucune URL d'EPUB retournée");
    }
    
    console.log("✅ EPUB généré et uploadé avec succès:", data.url);
    return data.url;
  } catch (error) {
    console.error("💥 Erreur lors de la génération de l'EPUB:", error);
    throw error;
  }
};
