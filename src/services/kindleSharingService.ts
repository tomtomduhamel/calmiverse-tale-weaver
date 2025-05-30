
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
    
    const { data: storyData, error: storyError } = await supabase
      .from('stories')
      .select('*')
      .eq('id', storyId)
      .single();
    
    if (storyError || !storyData) {
      console.error('Erreur lors de la récupération de l\'histoire:', storyError);
      throw new Error("Histoire introuvable");
    }

    console.log('Données complètes de l\'histoire récupérées:', {
      id: storyData.id,
      title: storyData.title,
      hasContent: !!storyData.content
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
    
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('firstname, lastname, kindle_email')
      .eq('id', authorId)
      .single();

    if (userError) {
      console.error('Erreur lors de la récupération des données utilisateur:', userError);
      throw new Error(`Impossible de récupérer les informations utilisateur: ${userError.message}`);
    }

    console.log('Données utilisateur récupérées:', userData);
    return userData;
  },

  /**
   * Crée un fichier EPUB formaté pour Kindle
   */
  async createKindleEpub(story: Story): Promise<string> {
    console.log('Création du fichier EPUB pour Kindle:', story.title);

    // Formatage du contenu avec page de titre
    const childrenText = story.childrenNames && story.childrenNames.length > 0
      ? story.childrenNames.length === 1 
        ? story.childrenNames[0]
        : `${story.childrenNames.slice(0, -1).join(', ')} et ${story.childrenNames[story.childrenNames.length - 1]}`
      : "votre enfant";

    const titlePage = `
      <div style="text-align: center; page-break-after: always; padding: 50px 0;">
        <h1 style="font-size: 2.5em; margin-bottom: 30px; font-weight: bold;">${story.title}</h1>
        <p style="font-size: 1.2em; margin-bottom: 20px; font-style: italic;">${story.objective}</p>
        <p style="font-size: 1.1em;">Une histoire pour ${childrenText}</p>
      </div>
    `;

    const storyContent = story.story_text
      .split('\n')
      .map(paragraph => paragraph.trim())
      .filter(paragraph => paragraph.length > 0)
      .map(paragraph => `<p style="margin-bottom: 15px; line-height: 1.6;">${paragraph}</p>`)
      .join('');

    // Créer une version modifiée de l'histoire avec le contenu formaté
    const kindleStory: Story = {
      ...story,
      story_text: titlePage + storyContent
    };

    // Générer et uploader l'EPUB
    const epubUrl = await generateAndUploadEpub(kindleStory);
    console.log('EPUB créé pour Kindle:', epubUrl);
    
    return epubUrl;
  },

  /**
   * Envoie les données au webhook N8N pour Kindle avec fichier EPUB
   */
  async sendToKindleWebhook(webhookData: KindleShareData) {
    const kindleWebhookUrl = 'https://tomtomduhamel.app.n8n.cloud/webhook-test/7bca54e0-e309-4c09-9aa3-83b205220d11';
    
    console.log('Envoi des données au webhook N8N Kindle:', {
      ...webhookData,
      content: `${webhookData.content.substring(0, 100)}...`, // Log tronqué pour la lisibilité
      epubUrl: webhookData.epubUrl,
      epubFilename: webhookData.epubFilename
    });
    
    const response = await fetch(kindleWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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

    // Créer le fichier EPUB
    const epubUrl = await this.createKindleEpub(story);
    
    // Créer le nom de fichier EPUB (nettoyer le titre pour éviter les caractères spéciaux)
    const cleanTitle = story.title.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_');
    const epubFilename = `${cleanTitle}.epub`;

    const preparedData: KindleShareData = {
      firstname: userData.firstname || "",
      lastname: userData.lastname || "",
      title: story.title,
      content: story.story_text,
      childrennames: story.childrenNames || [],
      objective: story.objective || "",
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
