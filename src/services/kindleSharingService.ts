
import { generateAndUploadEpub } from './epubService';
import { supabase } from '@/integrations/supabase/client';
import type { Story } from '@/types/story';

export interface KindleShareData {
  firstname: string;
  lastname: string;
  title: string;
  content: string;
  childrennames: string[];
  objective: string;
  kindleEmail: string;
  epubUrl?: string;
  epubFilename?: string;
}

export const kindleSharingService = {
  /**
   * Récupère les données complètes de l'histoire pour Kindle
   */
  async getCompleteStoryData(storyId: string): Promise<Story> {
    console.log('📖 [KindleService] Récupération des données complètes de l\'histoire:', storyId);
    
    if (!storyId) {
      throw new Error("ID de l'histoire manquant");
    }
    
    try {
      console.log('🌐 [KindleService] Utilisation du client Supabase pour récupérer l\'histoire');
      
      const { data: storyData, error } = await supabase
        .from('stories')
        .select('*')
        .eq('id', storyId)
        .single();
      
      if (error) {
        console.error('❌ [KindleService] Erreur Supabase:', error);
        throw new Error(`Erreur lors de la récupération de l'histoire: ${error.message}`);
      }
      
      if (!storyData) {
        console.error('❌ [KindleService] Aucune donnée retournée pour l\'histoire:', storyId);
        throw new Error("Histoire introuvable");
      }
      
      console.log('📥 [KindleService] Données reçues:', {
        id: storyData.id,
        title: storyData.title,
        hasContent: !!storyData.content,
        contentLength: storyData.content?.length || 0,
        authorId: storyData.authorid
      });
      
      // CORRECTION: Validation du contenu depuis la colonne 'content'
      if (!storyData.content || storyData.content.length < 10) {
        console.error('❌ [KindleService] Contenu insuffisant:', {
          hasContent: !!storyData.content,
          contentLength: storyData.content?.length || 0
        });
        throw new Error("Le contenu de l'histoire est trop court ou manquant");
      }

      // CORRECTION: Mapping correct des données - utiliser 'content' au lieu de 'story_text'
      const story: Story = {
        id: storyData.id,
        title: storyData.title || "Histoire sans titre",
        preview: storyData.preview || "",
        objective: storyData.objective || "",
        childrenIds: storyData.childrenids || [],
        childrenNames: storyData.childrennames || [],
        createdAt: new Date(storyData.createdat),
        status: storyData.status as any || 'ready',
        content: storyData.content, // CORRECTION: utiliser 'content' directement
        story_summary: storyData.summary || "",
        authorId: storyData.authorid
      };

      console.log('✅ [KindleService] Histoire mappée avec succès:', {
        id: story.id,
        title: story.title,
        contentLength: story.content.length,
        authorId: story.authorId
      });

      return story;
    } catch (error) {
      console.error('💥 [KindleService] Erreur lors de la récupération de l\'histoire:', error);
      
      // Messages d'erreur plus explicites pour l'utilisateur
      if (error instanceof Error) {
        if (error.message.includes('not found') || error.message.includes('introuvable')) {
          throw new Error("Cette histoire n'existe pas ou vous n'avez pas les droits pour y accéder.");
        }
        if (error.message.includes('permission') || error.message.includes('unauthorized')) {
          throw new Error("Vous n'avez pas les permissions nécessaires pour accéder à cette histoire.");
        }
        throw error;
      }
      
      throw new Error("Erreur technique lors de la récupération de l'histoire. Veuillez réessayer.");
    }
  },

  /**
   * Récupère les informations de l'utilisateur pour Kindle
   */
  async getUserData(authorId: string) {
    console.log('👤 [KindleService] Récupération des données utilisateur pour:', authorId);
    
    if (!authorId) {
      throw new Error("ID de l'auteur manquant");
    }
    
    try {
      const { data: userData, error } = await supabase
        .from('users')
        .select('firstname, lastname, kindle_email')
        .eq('id', authorId)
        .single();
      
      if (error) {
        console.error('❌ [KindleService] Erreur Supabase utilisateur:', error);
        throw new Error(`Erreur lors de la récupération des données utilisateur: ${error.message}`);
      }
      
      if (!userData) {
        console.error('❌ [KindleService] Utilisateur introuvable:', authorId);
        throw new Error("Utilisateur introuvable");
      }
      
      console.log('📥 [KindleService] Données utilisateur récupérées:', {
        hasFirstname: !!userData.firstname,
        hasLastname: !!userData.lastname,
        hasKindleEmail: !!userData.kindle_email
      });
      
      return userData;
    } catch (error) {
      console.error('💥 [KindleService] Erreur lors de la récupération des données utilisateur:', error);
      throw error;
    }
  },

  /**
   * Valide l'email Kindle
   */
  validateKindleEmail(email: string): boolean {
    if (!email || typeof email !== 'string') {
      console.warn('⚠️ [KindleService] Email manquant ou invalide:', email);
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(email);
    
    console.log(`${isValid ? '✅' : '❌'} [KindleService] Validation email Kindle:`, {
      email,
      isValid
    });
    
    return isValid;
  },

  /**
   * Envoie les données au webhook N8N pour Kindle avec fichier EPUB
   */
  async sendToKindleWebhook(webhookData: KindleShareData) {
    console.log('🚀 [KindleService] Début envoi webhook N8N pour Kindle');
    
    const kindleWebhookUrl = 'https://n8n.srv856374.hstgr.cloud/webhook/7bca54e0-e309-4c09-9aa3-83b205220d11';
    
    // Validation des données avant envoi
    if (!webhookData.epubUrl) {
      console.error('❌ [KindleService] URL de l\'EPUB manquante');
      throw new Error("URL de l'EPUB manquante");
    }
    
    if (!this.validateKindleEmail(webhookData.kindleEmail)) {
      console.error('❌ [KindleService] Email Kindle invalide:', webhookData.kindleEmail);
      throw new Error("Email Kindle invalide");
    }
    
    console.log('📤 [KindleService] Envoi des données au webhook N8N Kindle:', {
      ...webhookData,
      content: `${webhookData.content.substring(0, 100)}...`,
      epubUrl: webhookData.epubUrl,
      epubFilename: webhookData.epubFilename
    });
    
    try {
      const response = await fetch(kindleWebhookUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'User-Agent': 'Calmiverse-App'
        },
        body: JSON.stringify(webhookData)
      });

      console.log('📡 [KindleService] Réponse webhook N8N:', {
        status: response.status,
        statusText: response.statusText
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [KindleService] Erreur webhook Kindle:', response.status, errorText);
        throw new Error(`Erreur webhook Kindle: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ [KindleService] Réponse du webhook N8N Kindle:', result);
      return result;
    } catch (error) {
      console.error('💥 [KindleService] Erreur lors de l\'envoi au webhook N8N:', error);
      throw error;
    }
  },

  /**
   * Prépare les données pour l'envoi Kindle avec génération d'EPUB
   */
  async prepareKindleShareData(storyId: string): Promise<KindleShareData> {
    console.log('🔄 [KindleService] Préparation des données pour l\'envoi Kindle de l\'histoire:', storyId);
    
    try {
      // Récupérer les données complètes de l'histoire
      const story = await this.getCompleteStoryData(storyId);
      
      // Vérification que l'authorId est présent
      if (!story.authorId) {
        console.error('❌ [KindleService] AuthorId manquant dans l\'histoire:', storyId);
        throw new Error("Impossible d'identifier l'auteur de cette histoire.");
      }
      
      const userData = await this.getUserData(story.authorId);

      if (!userData?.kindle_email) {
        console.error('❌ [KindleService] Aucun email Kindle configuré pour l\'utilisateur:', story.authorId);
        throw new Error("Aucun email Kindle configuré. Veuillez configurer votre email Kindle dans les paramètres.");
      }

      if (!this.validateKindleEmail(userData.kindle_email)) {
        console.error('❌ [KindleService] Email Kindle invalide:', userData.kindle_email);
        throw new Error("L'email Kindle configuré n'est pas valide. Veuillez le corriger dans les paramètres.");
      }

      // CORRECTION: Créer l'EPUB avec le bon champ 'content'
      console.log('📔 [KindleService] Génération du fichier EPUB...');
      const epubUrl = await generateAndUploadEpub(story);
      
      // Créer le nom de fichier EPUB
      const cleanTitle = story.title.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_');
      const epubFilename = `${cleanTitle}.epub`;

      // Gérer l'objectif qui peut être string ou objet
      const objectiveText = typeof story.objective === 'string' 
        ? story.objective 
        : story.objective?.name || story.objective?.value || '';

      const preparedData: KindleShareData = {
        firstname: userData.firstname || "",
        lastname: userData.lastname || "",
        title: story.title,
        content: story.content, // CORRECTION: Utilisation du bon champ 'content'
        childrennames: story.childrenNames || [],
        objective: objectiveText,
        kindleEmail: userData.kindle_email,
        epubUrl,
        epubFilename
      };

      console.log('✅ [KindleService] Données préparées pour Kindle avec EPUB:', {
        ...preparedData,
        content: `${preparedData.content.substring(0, 100)}...`,
        epubUrl: preparedData.epubUrl,
        epubFilename: preparedData.epubFilename
      });

      return preparedData;
    } catch (error) {
      console.error('💥 [KindleService] Erreur lors de la préparation des données Kindle:', error);
      
      if (error instanceof Error) {
        throw error;
      }
      
      throw new Error("Erreur technique lors de la préparation de l'envoi Kindle. Veuillez réessayer.");
    }
  }
};
