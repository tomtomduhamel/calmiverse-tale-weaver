import { supabase } from '@/integrations/supabase/client';
import type { Story } from '@/types/story';
import { translateObjective, cleanEpubTitle } from '@/utils/objectiveTranslations';
import { stripStoryEmotionTags } from '@/utils/storyContentFormatter';

interface EpubCache {
  [key: string]: {
    url: string;
    timestamp: number;
    contentHash: string;
  };
}

// Cache en mémoire avec TTL de 1 heure
const epubCache: EpubCache = {};
const CACHE_TTL = 60 * 60 * 1000; // 1 heure

export const optimizedEpubService = {
  /**
   * Génère un hash du contenu pour le cache
   */
  generateContentHash(story: Story): string {
    const cleanContent = stripStoryEmotionTags(story.content);
    const content = `${story.title}|${cleanContent}|${story.childrenNames?.join(',')}`;
    return btoa(content).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
  },

  /**
   * Vérifie si un EPUB est en cache et encore valide
   */
  getCachedEpub(story: Story): string | null {
    const hash = this.generateContentHash(story);
    const cached = epubCache[hash];
    
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      console.log('✅ [OptimizedEpub] EPUB trouvé en cache:', cached.url);
      return cached.url;
    }
    
    if (cached) {
      delete epubCache[hash]; // Supprimer le cache expiré
    }
    
    return null;
  },

  /**
   * Met en cache un EPUB généré
   */
  cacheEpub(story: Story, url: string): void {
    const hash = this.generateContentHash(story);
    epubCache[hash] = {
      url,
      timestamp: Date.now(),
      contentHash: hash
    };
    console.log('💾 [OptimizedEpub] EPUB mis en cache:', hash);
  },

  /**
   * Optimise le contenu avant la génération EPUB
   */
  optimizeContent(story: Story): string {
    if (!story.content) return '';
    
    // Nettoyer les balises d'émotions et optimiser le contenu
    let optimizedContent = stripStoryEmotionTags(story.content)
      .replace(/\n{3,}/g, '\n\n') // Réduire les sauts de ligne multiples
      .replace(/\s{2,}/g, ' ') // Réduire les espaces multiples
      .trim();

    // Limiter la taille si nécessaire (max 100KB)
    const maxSize = 100 * 1024;
    if (optimizedContent.length > maxSize) {
      console.warn('⚠️ [OptimizedEpub] Contenu tronqué pour optimisation');
      optimizedContent = optimizedContent.substring(0, maxSize) + '...';
    }

    return optimizedContent;
  },

  /**
   * Génère un EPUB avec optimisations et cache
   */
  async generateAndUploadOptimizedEpub(story: Story): Promise<string> {
    console.log('🚀 [OptimizedEpub] Début génération optimisée pour:', story.title);

    // Vérifier le cache d'abord
    const cachedUrl = this.getCachedEpub(story);
    if (cachedUrl) {
      return cachedUrl;
    }

    // Validation rapide
    if (!story.title || !story.content) {
      throw new Error("Les données de l'histoire sont incomplètes");
    }

    // Récupérer l'image de l'histoire si elle existe
    let imageBlob: Blob | null = null;
    if (story.image_path) {
      console.log('🖼️ [OptimizedEpub] Récupération de l\'image:', story.image_path);
      try {
        const { fetchStoryImageBlob } = await import('@/utils/supabaseImageUtils');
        imageBlob = await fetchStoryImageBlob(story.image_path);
        if (imageBlob) {
          console.log('✅ [OptimizedEpub] Image récupérée avec succès');
        } else {
          console.warn('⚠️ [OptimizedEpub] Impossible de récupérer l\'image');
        }
      } catch (error) {
        console.warn('⚠️ [OptimizedEpub] Erreur récupération image:', error);
        imageBlob = null;
      }
    }

    // Optimiser le contenu
    const optimizedContent = this.optimizeContent(story);
    
    if (optimizedContent.length < 10) {
      throw new Error("Le contenu optimisé est trop court");
    }

    // Formater pour Kindle avec optimisations
    const kindleContent = this.formatStoryForKindle(story, optimizedContent);
    
    // Nom de fichier optimisé en utilisant la fonction de nettoyage appropriée
    const cleanTitle = cleanEpubTitle(story.title).substring(0, 50); // Limiter la longueur

    if (!cleanTitle) {
      throw new Error("Impossible de générer un nom de fichier valide");
    }

    console.log('📤 [OptimizedEpub] Appel fonction Edge avec contenu optimisé...');

    try {
      // Convertir l'image en base64 si elle existe
      let imageBase64: string | null = null;
      if (imageBlob) {
        imageBase64 = await this.blobToBase64(imageBlob);
        console.log('🔄 [OptimizedEpub] Image convertie en base64');
      }

      const { data, error } = await supabase.functions.invoke('upload-epub', {
        body: { 
          content: kindleContent, 
          filename: cleanTitle,
          optimized: true, // Flag pour indiquer le contenu optimisé
          imageBlob: imageBase64 // Inclure l'image encodée
        }
      });

      if (error) {
        throw new Error(`Erreur fonction Edge: ${error.message}`);
      }
      
      if (!data?.url) {
        throw new Error("Aucune URL retournée par le serveur");
      }

      // Validation de l'URL
      try {
        new URL(data.url);
      } catch {
        throw new Error("URL générée invalide");
      }
      
      // Mettre en cache
      this.cacheEpub(story, data.url);
      
      console.log('✅ [OptimizedEpub] EPUB optimisé généré avec succès:', data.url);
      return data.url;

    } catch (error) {
      console.error('💥 [OptimizedEpub] Erreur génération:', error);
      
      // Messages d'erreur améliorés
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          throw new Error("Délai d'attente dépassé. Le serveur met trop de temps à répondre.");
        }
        if (error.message.includes('Failed to send a request')) {
          throw new Error("Impossible de contacter le serveur. Vérifiez votre connexion internet.");
        }
        if (error.message.includes('bucket')) {
          throw new Error("Problème de stockage sur le serveur. Veuillez réessayer plus tard.");
        }
        throw error;
      }
      
      throw new Error("Erreur inconnue lors de la génération EPUB");
    }
  },

  /**
   * Formate le contenu pour Kindle avec optimisations
   */
  formatStoryForKindle(story: Story, optimizedContent: string): string {
    try {
      // Formater les noms des enfants de manière concise
      const childrenText = story.childrenNames && story.childrenNames.length > 0
        ? story.childrenNames.length === 1 
          ? story.childrenNames[0]
          : story.childrenNames.join(' et ')
        : "votre enfant";

      // Traduire l'objectif en français
      const objectiveText = translateObjective(story.objective);
      
      // Nettoyer le titre pour l'affichage
      const displayTitle = cleanEpubTitle(story.title);

      // Page de titre compacte
      const titlePage = `
        <div class="title-page">
          <h1>${this.escapeHtml(displayTitle)}</h1>
          <p>${this.escapeHtml(objectiveText)}</p>
          <p>Pour ${this.escapeHtml(childrenText)}</p>
        </div>
      `;

      // Contenu formaté avec paragraphes optimisés
      const storyContent = optimizedContent
        .split('\n')
        .map(paragraph => paragraph.trim())
        .filter(paragraph => paragraph.length > 0)
        .map(paragraph => `<p>${this.escapeHtml(paragraph)}</p>`)
        .join('\n');

      return titlePage + '\n' + storyContent;
    } catch (error) {
      console.error("Erreur formatage Kindle:", error);
      throw new Error("Impossible de formater l'histoire pour Kindle");
    }
  },

  /**
   * Escape HTML avec optimisation
   */
  escapeHtml(text: string): string {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },

  /**
   * Convertit un Blob en base64
   */
  async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Retourner seulement la partie base64 (sans le préfixe data:...)
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  },

  /**
   * Nettoie le cache manuellement
   */
  clearCache(): void {
    Object.keys(epubCache).forEach(key => delete epubCache[key]);
    console.log('🧹 [OptimizedEpub] Cache nettoyé');
  }
};
