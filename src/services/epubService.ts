
import { supabase } from '@/integrations/supabase/client';
import type { Story } from '@/types/story';

export const generateAndUploadEpub = async (story: Story): Promise<string> => {
  try {
    console.log("🔧 Début de la génération de l'EPUB pour l'histoire:", story.title);
    
    // Validation des données d'entrée
    if (!story.title || !story.story_text) {
      throw new Error("Les données de l'histoire sont incomplètes (titre ou contenu manquant)");
    }
    
    if (story.story_text.length < 10) {
      throw new Error("Le contenu de l'histoire est trop court pour générer un EPUB");
    }
    
    // Créer le contenu HTML formaté pour Kindle
    const kindleContent = formatStoryForKindle(story);
    
    if (!kindleContent || kindleContent.length < 50) {
      throw new Error("Le contenu formaté pour Kindle est invalide");
    }
    
    // Nettoyer le nom de fichier
    const cleanTitle = story.title.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_');
    
    if (!cleanTitle) {
      throw new Error("Impossible de générer un nom de fichier valide à partir du titre");
    }
    
    console.log("📤 Appel à la fonction Edge upload-epub via le client Supabase...");

    const requestBody = { 
      content: kindleContent, 
      filename: cleanTitle
    };
    
    console.log("📦 Corps de la requête:", {
      filename: cleanTitle,
      contentLength: kindleContent.length,
      contentPreview: kindleContent.substring(0, 100) + "..."
    });

    // Utilisation du client Supabase pour appeler la fonction Edge
    const { data, error } = await supabase.functions.invoke('upload-epub', {
      body: requestBody
    });

    console.log("📡 Réponse de la fonction Edge:", {
      hasData: !!data,
      hasError: !!error,
      data: data
    });

    if (error) {
      console.error("❌ Erreur de la fonction Edge:", error);
      throw new Error(`Erreur de la fonction upload-epub: ${error.message}`);
    }
    
    if (!data) {
      console.error("❌ Aucune donnée retournée par la fonction Edge");
      throw new Error("Aucune réponse de la fonction de génération EPUB");
    }
    
    if (data.error) {
      console.error("❌ Erreur dans la réponse:", data.message);
      throw new Error(`Erreur EPUB: ${data.message}`);
    }
    
    if (!data.url) {
      console.error("❌ Pas d'URL retournée par la fonction Edge");
      throw new Error("Aucune URL d'EPUB retournée par le serveur");
    }
    
    // Validation de l'URL
    try {
      new URL(data.url);
    } catch {
      throw new Error("L'URL générée pour l'EPUB n'est pas valide");
    }
    
    // Test de l'accessibilité de l'URL générée
    console.log("🔍 Test d'accessibilité de l'URL générée:", data.url);
    try {
      const testResponse = await fetch(data.url, { method: 'HEAD' });
      console.log("✅ URL accessible, statut:", testResponse.status);
    } catch (urlError) {
      console.warn("⚠️ Problème d'accessibilité de l'URL:", urlError);
    }
    
    console.log("✅ EPUB généré et uploadé avec succès:", {
      url: data.url,
      filename: data.filename,
      size: data.size
    });
    
    return data.url;
  } catch (error) {
    console.error("💥 Erreur complète lors de la génération de l'EPUB:", {
      message: error instanceof Error ? error.message : 'Erreur inconnue',
      stack: error instanceof Error ? error.stack : 'Pas de stack trace',
      name: error instanceof Error ? error.name : 'Type d\'erreur inconnu',
      storyTitle: story?.title || 'Titre inconnu',
      timestamp: new Date().toISOString()
    });
    
    // Améliorer le message d'erreur pour l'utilisateur
    if (error instanceof Error) {
      if (error.message.includes('bucket')) {
        throw new Error("Problème de stockage sur le serveur. Veuillez réessayer plus tard.");
      }
      if (error.message.includes('network') || error.message.includes('connexion') || error.message.includes('fetch')) {
        throw new Error("Problème de connexion. Vérifiez votre internet et réessayez.");
      }
      if (error.message.includes('HTTP 403')) {
        throw new Error("Problème d'autorisation. Veuillez vous reconnecter et réessayer.");
      }
      if (error.message.includes('HTTP 500')) {
        throw new Error("Erreur serveur temporaire. Veuillez réessayer dans quelques minutes.");
      }
      throw error;
    }
    
    throw new Error("Erreur inconnue lors de la génération de l'EPUB");
  }
};

function formatStoryForKindle(story: Story): string {
  try {
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
  } catch (error) {
    console.error("Erreur lors du formatage de l'histoire:", error);
    throw new Error("Impossible de formater l'histoire pour Kindle");
  }
}

function escapeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
