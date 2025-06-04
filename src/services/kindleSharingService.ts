
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
    console.log('📖 [KindleService] Récupération des données complètes de l\'histoire:', storyId);
    
    if (!storyId) {
      throw new Error("ID de l'histoire manquant");
    }
    
    // Utilisation d'un appel fetch direct pour plus de transparence
    const supabaseUrl = 'https://ioeihnoxvtpxtqhxklpw.supabase.co';
    const apiUrl = `${supabaseUrl}/rest/v1/stories?id=eq.${storyId}&select=*`;
    
    console.log('🌐 [KindleService] URL API Supabase:', apiUrl);
    
    try {
      const response = await fetch(apiUrl, {
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvZWlobm94dnRweHRxaHhrbHB3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU5ODQ1MzYsImV4cCI6MjA2MTU2MDUzNn0.5KolFPfnppqfb8lbYnWhJKo6GZL_VCxn3Zx1hxyLaro',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvZWlobm94dnRweHRxaHhrbHB3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU5ODQ1MzYsImV4cCI6MjA2MTU2MDUzNn0.5KolFPfnppqfb8lbYnWhJKo6GZL_VCxn3Zx1hxyLaro',
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📡 [KindleService] Réponse API stories:', {
        status: response.status,
        statusText: response.statusText
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [KindleService] Erreur API stories:', errorText);
        throw new Error(`Erreur API: ${response.status} - ${errorText}`);
      }
      
      const storyDataArray = await response.json();
      console.log('📥 [KindleService] Données reçues:', storyDataArray);
      
      if (!storyDataArray || storyDataArray.length === 0) {
        throw new Error("Histoire introuvable ou inaccessible");
      }
      
      const storyData = storyDataArray[0];
      
      if (!storyData.content || storyData.content.length < 10) {
        throw new Error("Le contenu de l'histoire est trop court ou manquant");
      }

      console.log('✅ [KindleService] Données complètes de l\'histoire récupérées:', {
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
    } catch (error) {
      console.error('💥 [KindleService] Erreur lors de la récupération de l\'histoire:', error);
      throw error;
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
    
    const supabaseUrl = 'https://ioeihnoxvtpxtqhxklpw.supabase.co';
    const apiUrl = `${supabaseUrl}/rest/v1/users?id=eq.${authorId}&select=firstname,lastname,kindle_email`;
    
    console.log('🌐 [KindleService] URL API utilisateur:', apiUrl);
    
    try {
      const response = await fetch(apiUrl, {
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvZWlobm94dnRweHRxaHhrbHB3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU5ODQ1MzYsImV4cCI6MjA2MTU2MDUzNn0.5KolFPfnppqfb8lbYnWhJKo6GZL_VCxn3Zx1hxyLaro',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvZWlobm94dnRweHRxaHhrbHB3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU5ODQ1MzYsImV4cCI6MjA2MTU2MDUzNn0.5KolFPfnppqfb8lbYnWhJKo6GZL_VCxn3Zx1hxyLaro',
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📡 [KindleService] Réponse API utilisateur:', {
        status: response.status,
        statusText: response.statusText
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [KindleService] Erreur API utilisateur:', errorText);
        throw new Error(`Erreur API utilisateur: ${response.status} - ${errorText}`);
      }
      
      const userData = await response.json();
      console.log('📥 [KindleService] Données utilisateur reçues:', userData);
      
      if (!userData || userData.length === 0) {
        throw new Error("Utilisateur introuvable");
      }
      
      return userData[0];
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
    
    // Validation basique d'email
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
    
    const kindleWebhookUrl = 'https://tomtomduhamel.app.n8n.cloud/webhook-test/7bca54e0-e309-4c09-9aa3-83b205220d11';
    
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
      content: `${webhookData.content.substring(0, 100)}...`, // Log tronqué pour la lisibilité
      epubUrl: webhookData.epubUrl,
      epubFilename: webhookData.epubFilename
    });
    
    try {
      console.log('🌐 [KindleService] URL du webhook N8N:', kindleWebhookUrl);
      
      // Test d'accessibilité de l'URL EPUB avant envoi
      console.log('🔍 [KindleService] Test de l\'URL EPUB avant envoi:', webhookData.epubUrl);
      try {
        const epubTestResponse = await fetch(webhookData.epubUrl, { method: 'HEAD' });
        console.log('✅ [KindleService] EPUB accessible, statut:', epubTestResponse.status);
      } catch (epubError) {
        console.warn('⚠️ [KindleService] Avertissement: URL EPUB potentiellement inaccessible:', epubError);
      }
      
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
      const userData = await this.getUserData(story.authorId!);

      if (!userData?.kindle_email) {
        console.error('❌ [KindleService] Aucun email Kindle configuré pour l\'utilisateur:', story.authorId);
        throw new Error("Aucun email Kindle configuré. Veuillez configurer votre email Kindle dans les paramètres.");
      }

      if (!this.validateKindleEmail(userData.kindle_email)) {
        console.error('❌ [KindleService] Email Kindle invalide:', userData.kindle_email);
        throw new Error("L'email Kindle configuré n'est pas valide. Veuillez le corriger dans les paramètres.");
      }

      // Créer le fichier EPUB via le service dédié
      console.log('📔 [KindleService] Génération du fichier EPUB...');
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

      console.log('✅ [KindleService] Données préparées pour Kindle avec EPUB:', {
        ...preparedData,
        content: `${preparedData.content.substring(0, 100)}...`, // Log tronqué pour la lisibilité
        epubUrl: preparedData.epubUrl,
        epubFilename: preparedData.epubFilename
      });

      return preparedData;
    } catch (error) {
      console.error('💥 [KindleService] Erreur lors de la préparation des données Kindle:', error);
      throw error;
    }
  }
};
