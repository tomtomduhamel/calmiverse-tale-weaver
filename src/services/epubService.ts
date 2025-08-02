
import { supabase } from '@/integrations/supabase/client';
import type { Story } from '@/types/story';
import { translateObjective, cleanEpubTitle, formatFrenchTitle } from '@/utils/objectiveTranslations';
import { calculateReadingTime } from '@/utils/readingTime';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export const generateAndUploadEpub = async (story: Story): Promise<string> => {
  try {
    console.log("🔧 Début de la génération de l'EPUB pour l'histoire:", story.title);
    
    // CORRECTION: Validation avec le bon champ 'content'
    if (!story.title || !story.content) {
      throw new Error("Les données de l'histoire sont incomplètes (titre ou contenu manquant)");
    }
    
    if (story.content.length < 10) {
      throw new Error("Le contenu de l'histoire est trop court pour générer un EPUB");
    }
    
    // CORRECTION: Créer le contenu HTML formaté pour Kindle avec le bon champ
    const kindleContent = formatStoryForKindle(story);
    
    if (!kindleContent || kindleContent.length < 50) {
      throw new Error("Le contenu formaté pour Kindle est invalide");
    }
    
    // Nettoyer le nom de fichier en utilisant la fonction de nettoyage appropriée
    const cleanTitle = cleanEpubTitle(story.title);
    
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

    // Test de connectivité de la fonction Edge avant l'appel
    console.log("🔍 Test de connectivité de la fonction Edge...");
    
    try {
      // CORRECTION: Utiliser les URLs publiques au lieu des propriétés protégées
      const supabaseUrl = 'https://ioeihnoxvtpxtqhxklpw.supabase.co';
      const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvZWlobm94dnRweHRxaHhrbHB3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU5ODQ1MzYsImV4cCI6MjA2MTU2MDUzNn0.5KolFPfnppqfb8lbYnWhJKo6GZL_VCxn3Zx1hxyLaro';
      
      // Appel de test simple pour vérifier que la fonction Edge est accessible
      const testResponse = await fetch(`${supabaseUrl}/functions/v1/upload-epub`, {
        method: 'OPTIONS',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
        }
      });
      console.log("✅ Fonction Edge accessible, statut test:", testResponse.status);
    } catch (testError) {
      console.error("❌ Fonction Edge inaccessible:", testError);
      throw new Error("La fonction de génération d'EPUB n'est pas disponible. Veuillez contacter le support.");
    }

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
    // Formater les noms des enfants avec des virgules
    const childrenText = story.childrenNames && story.childrenNames.length > 0
      ? story.childrenNames.join(', ')
      : "votre enfant";

    // Traduire l'objectif en français
    const objectiveText = translateObjective(story.objective);
    
    // Nettoyer et formater le titre selon les règles françaises
    const displayTitle = formatFrenchTitle(cleanEpubTitle(story.title));

    // Calculer la durée de lecture et formater la date
    const readingTime = calculateReadingTime(story.content);
    const createdDate = format(story.createdAt, "d MMMM yyyy 'à' HH:mm", { locale: fr });

    // Page de titre formatée
    const titlePage = `
      <div class="title-page">
        <h1>${escapeHtml(displayTitle)}</h1>
        <p style="font-size: 1.1em; margin-bottom: 10px;">Histoire personnalisée pour ${escapeHtml(childrenText)}</p>
        <p style="font-size: 1.2em; margin-bottom: 10px; font-style: italic;">${escapeHtml(objectiveText)}</p>
        <p style="font-size: 0.9em; color: #666; margin-bottom: 40px;">${readingTime} • ${createdDate}</p>
      </div>
    `;

    // CORRECTION: Contenu de l'histoire formaté avec le bon champ 'content'
    const storyContent = story.content
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
