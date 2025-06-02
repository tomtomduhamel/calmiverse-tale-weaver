
import { supabase } from '@/integrations/supabase/client';
import { generateAndUploadEpub } from './epubService';
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
    console.log('Récupération des données complètes de l\'histoire:', storyId);
    
    if (!storyId) {
      throw new Error("ID de l'histoire manquant");
    }
    
    const { data: storyData, error: storyError } = await supabase
      .from('stories')
      .select('*')
      .eq('id', storyId)
      .single();
    
    if (storyError || !storyData) {
      console.error('Erreur lors de la récupération de l\'histoire:', storyError);
      throw new Error("Histoire introuvable ou inaccessible");
    }

    if (!storyData.content || storyData.content.length < 10) {
      throw new Error("Le contenu de l'histoire est trop court ou manquant");
    }

    console.log('Données complètes de l\'histoire récupérées:', {
      id: storyData.id,
      title: storyData.title,
      hasContent: !!storyData.content,
      contentLength: storyData.content?.length || 0
    });

    // Mapper les données au format Story
    const story: Story = {
      id: storyData.id,
      title: storyData.title || "Histoire sans titre",
      preview: storyData.preview || "",
      objective: storyData.objective || "",
      childrenIds: storyData.childrenids || [],
      childrenNames: storyData.childrennames || [],
      createdAt: new Date(storyData.createdat),
      status: storyData.status as any || 'ready',
      story_text: storyData.content || "",
      story_summary: storyData.summary || "",
      authorId: storyData.authorid
    };

    return story;
  },

  /**
   * Récupère les informations de l'utilisateur pour Kindle
   */
  async getUserData(authorId: string) {
    console.log('Récupération des données utilisateur pour:', authorId);
    
    if (!authorId) {
      throw new Error("ID de l'auteur manquant");
    }
    
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('firstname, lastname, kindle_email')
      .eq('id', authorId)
      .single();

    if (userError) {
      console.error('Erreur lors de la récupération des données utilisateur:', userError);
      throw new Error(`Impossible de récupérer les informations utilisateur: ${userError.message}`);
    }

    if (!userData) {
      throw new Error("Utilisateur introuvable");
    }

    console.log('Données utilisateur récupérées:', userData);
    return userData;
  },

  /**
   * Valide l'email Kindle
   */
  validateKindleEmail(email: string): boolean {
    if (!email || typeof email !== 'string') {
      return false;
    }
    
    // Validation basique d'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Envoie les données au webhook N8N pour Kindle avec fichier EPUB
   */
  async sendToKindleWebhook(webhookData: KindleShareData) {
    const kindleWebhookUrl = 'https://tomtomduhamel.app.n8n.cloud/webhook-test/7bca54e0-e309-4c09-9aa3-83b205220d11';
    
    // Validation des données avant envoi
    if (!webhookData.epubUrl) {
      throw new Error("URL de l'EPUB manquante");
    }
    
    if (!this.validateKindleEmail(webhookData.kindleEmail)) {
      throw new Error("Email Kindle invalide");
    }
    
    console.log('Envoi des données au webhook N8N Kindle:', {
      ...webhookData,
      content: `${webhookData.content.substring(0, 100)}...`, // Log tronqué pour la lisibilité
      epubUrl: webhookData.epubUrl,
      epubFilename: webhookData.epubFilename
    });
    
    const response = await fetch(kindleWebhookUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'User-Agent': 'Calmiverse-App'
      },
      body: JSON.stringify(webhookData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erreur webhook Kindle:', response.status, errorText);
      throw new Error(`Erreur webhook Kindle: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('Réponse du webhook N8N Kindle:', result);
    return result;
  },

  /**
   * Prépare les données pour l'envoi Kindle avec génération d'EPUB
   */
  async prepareKindleShareData(storyId: string): Promise<KindleShareData> {
    console.log('Préparation des données pour l\'envoi Kindle de l\'histoire:', storyId);
    
    // Récupérer les données complètes de l'histoire
    const story = await this.getCompleteStoryData(storyId);
    const userData = await this.getUserData(story.authorId!);

    if (!userData?.kindle_email) {
      console.error('Aucun email Kindle configuré pour l\'utilisateur:', story.authorId);
      throw new Error("Aucun email Kindle configuré. Veuillez configurer votre email Kindle dans les paramètres.");
    }

    if (!this.validateKindleEmail(userData.kindle_email)) {
      throw new Error("L'email Kindle configuré n'est pas valide. Veuillez le corriger dans les paramètres.");
    }

    // Créer le fichier EPUB via le service dédié
    console.log('Génération du fichier EPUB...');
    const epubUrl = await generateAndUploadEpub(story);
    
    // Créer le nom de fichier EPUB (nettoyer le titre pour éviter les caractères spéciaux)
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
      content: story.story_text,
      childrennames: story.childrenNames || [],
      objective: objectiveText,
      kindleEmail: userData.kindle_email,
      epubUrl,
      epubFilename
    };

    console.log('Données préparées pour Kindle avec EPUB:', {
      ...preparedData,
      content: `${preparedData.content.substring(0, 100)}...`, // Log tronqué pour la lisibilité
      epubUrl: preparedData.epubUrl,
      epubFilename: preparedData.epubFilename
    });

    return preparedData;
  }
};
