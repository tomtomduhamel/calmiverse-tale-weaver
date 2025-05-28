
import { supabase } from '@/integrations/supabase/client';

export interface KindleShareData {
  firstname: string;
  lastname: string;
  title: string;
  content: string;
  childrennames: string[];
  objective: string;
}

export const kindleSharingService = {
  /**
   * Récupère les données de l'histoire pour Kindle
   */
  async getStoryData(storyId: string) {
    const { data: storyData, error: storyError } = await supabase
      .from('stories')
      .select('title, content, childrennames, objective, authorid')
      .eq('id', storyId)
      .single();
    
    if (storyError || !storyData) {
      throw new Error("Histoire introuvable");
    }

    return storyData;
  },

  /**
   * Récupère les informations de l'utilisateur pour Kindle
   */
  async getUserData(authorId: string) {
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('firstname, lastname')
      .eq('id', authorId)
      .single();

    if (userError) {
      console.warn('Impossible de récupérer les informations utilisateur:', userError);
    }

    return userData;
  },

  /**
   * Envoie les données au webhook N8N pour Kindle
   */
  async sendToKindleWebhook(webhookData: KindleShareData) {
    const kindleWebhookUrl = 'https://tomtomduhamel.app.n8n.cloud/webhook-test/7bca54e0-e309-4c09-9aa3-83b205220d11';
    
    const response = await fetch(kindleWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(webhookData)
    });

    if (!response.ok) {
      throw new Error(`Erreur webhook Kindle: ${response.status}`);
    }

    console.log('Données envoyées au webhook N8N Kindle:', webhookData);
  },

  /**
   * Prépare les données pour l'envoi Kindle
   */
  async prepareKindleShareData(storyId: string): Promise<KindleShareData> {
    const storyData = await this.getStoryData(storyId);
    const userData = await this.getUserData(storyData.authorid);

    return {
      firstname: userData?.firstname || "",
      lastname: userData?.lastname || "",
      title: storyData.title || "Histoire sans titre",
      content: storyData.content || "",
      childrennames: storyData.childrennames || [],
      objective: storyData.objective || ""
    };
  }
};
