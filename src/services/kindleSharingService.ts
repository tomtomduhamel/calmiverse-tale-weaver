
import { supabase } from '@/integrations/supabase/client';

export interface KindleShareData {
  firstname: string;
  lastname: string;
  title: string;
  content: string;
  childrennames: string[];
  objective: string;
  kindleEmail: string;
}

export const kindleSharingService = {
  /**
   * Récupère les données de l'histoire pour Kindle
   */
  async getStoryData(storyId: string) {
    console.log('Récupération des données de l\'histoire:', storyId);
    
    const { data: storyData, error: storyError } = await supabase
      .from('stories')
      .select('title, content, childrennames, objective, authorid')
      .eq('id', storyId)
      .single();
    
    if (storyError || !storyData) {
      console.error('Erreur lors de la récupération de l\'histoire:', storyError);
      throw new Error("Histoire introuvable");
    }

    console.log('Données de l\'histoire récupérées:', storyData);
    return storyData;
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
   * Envoie les données au webhook N8N pour Kindle
   */
  async sendToKindleWebhook(webhookData: KindleShareData) {
    const kindleWebhookUrl = 'https://tomtomduhamel.app.n8n.cloud/webhook-test/7bca54e0-e309-4c09-9aa3-83b205220d11';
    
    console.log('Envoi des données au webhook N8N Kindle:', {
      ...webhookData,
      content: `${webhookData.content.substring(0, 100)}...` // Log tronqué pour la lisibilité
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
   * Prépare les données pour l'envoi Kindle
   */
  async prepareKindleShareData(storyId: string): Promise<KindleShareData> {
    console.log('Préparation des données pour l\'envoi Kindle de l\'histoire:', storyId);
    
    const storyData = await this.getStoryData(storyId);
    const userData = await this.getUserData(storyData.authorid);

    if (!userData?.kindle_email) {
      console.error('Aucun email Kindle configuré pour l\'utilisateur:', storyData.authorid);
      throw new Error("Aucun email Kindle configuré. Veuillez configurer votre email Kindle dans les paramètres.");
    }

    const preparedData: KindleShareData = {
      firstname: userData.firstname || "",
      lastname: userData.lastname || "",
      title: storyData.title || "Histoire sans titre",
      content: storyData.content || "",
      childrennames: storyData.childrennames || [],
      objective: storyData.objective || "",
      kindleEmail: userData.kindle_email
    };

    console.log('Données préparées pour Kindle:', {
      ...preparedData,
      content: `${preparedData.content.substring(0, 100)}...` // Log tronqué pour la lisibilité
    });

    return preparedData;
  }
};
