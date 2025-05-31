
import { supabase } from '@/integrations/supabase/client';
import type { Story } from '@/types/story';

export const generateAndUploadEpub = async (story: Story): Promise<string> => {
  try {
    console.log("🔧 Début de la génération de l'EPUB pour l'histoire:", story.title);
    
    // Créer le contenu HTML formaté pour Kindle
    const kindleContent = formatStoryForKindle(story);
    
    // Nettoyer le nom de fichier
    const cleanTitle = story.title.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_');
    
    console.log("📤 Appel de la fonction Edge upload-epub...");

    // Appel à la fonction Edge Supabase avec le contenu formaté
    const { data, error } = await supabase.functions.invoke('upload-epub', {
      body: { 
        content: kindleContent, 
        filename: cleanTitle
      }
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

function formatStoryForKindle(story: Story): string {
  // Formater les noms des enfants
  const childrenText = story.childrenNames && story.childrenNames.length > 0
    ? story.childrenNames.length === 1 
      ? story.childrenNames[0]
      : `${story.childrenNames.slice(0, -1).join(', ')} et ${story.childrenNames[story.childrenNames.length - 1]}`
    : "votre enfant";

  // Gérer l'objectif qui peut être string ou objet
  const objectiveText = typeof story.objective === 'string' 
    ? story.objective 
    : story.objective?.name || story.objective?.value || '';

  // Page de titre formatée
  const titlePage = `
    <div class="title-page">
      <h1>${escapeHtml(story.title)}</h1>
      <p style="font-size: 1.2em; margin-bottom: 20px; font-style: italic;">${escapeHtml(objectiveText)}</p>
      <p style="font-size: 1.1em;">Une histoire pour ${escapeHtml(childrenText)}</p>
    </div>
  `;

  // Contenu de l'histoire formaté
  const storyContent = story.story_text
    .split('\n')
    .map(paragraph => paragraph.trim())
    .filter(paragraph => paragraph.length > 0)
    .map(paragraph => `<p>${escapeHtml(paragraph)}</p>`)
    .join('\n');

  return titlePage + '\n' + storyContent;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
