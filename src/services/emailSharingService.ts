
import { supabase } from '@/integrations/supabase/client';
import { generateToken } from '@/utils/tokenUtils';
import { formatStoryContentForEmail } from '@/utils/storyContentFormatter';

export interface EmailShareData {
  recipientEmail: string;
  storyTitle: string;
  storyContent: string;
  childrenNames: string[];
  storyObjective: string;
  senderFirstName: string;
  senderLastName: string;
  publicUrl: string;
  expirationDate: string;
}

export const emailSharingService = {
  /**
   * Récupère les données de l'histoire depuis Supabase
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
   * Récupère les informations de l'utilisateur depuis Supabase
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
   * Met à jour les données de partage dans Supabase
   */
  async updateSharingData(storyId: string, email: string, token: string, expiresAt: Date) {
    const { error: updateError } = await supabase
      .from('stories')
      .update({
        sharing: {
          publicAccess: {
            enabled: true,
            token,
            expiresAt: expiresAt.toISOString()
          },
          sharedEmails: [{
            email,
            sharedAt: new Date().toISOString(),
            accessCount: 0
          }]
        }
      })
      .eq('id', storyId);

    if (updateError) throw updateError;
  },

  /**
   * Envoie les données au webhook N8N pour l'email
   */
  async sendToEmailWebhook(webhookData: EmailShareData) {
    const n8nWebhookUrl = 'https://tomtomduhamel.app.n8n.cloud/webhook/9655e007-2b71-4b57-ab03-748eaa158ebe';
    
    const response = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(webhookData)
    });

    if (!response.ok) {
      throw new Error(`Erreur webhook: ${response.status}`);
    }

    console.log('Données envoyées au webhook N8N:', webhookData);
  },

  /**
   * Prépare les données pour l'envoi par email
   */
  async prepareEmailShareData(storyId: string, email: string): Promise<EmailShareData> {
    const storyData = await this.getStoryData(storyId);
    const userData = await this.getUserData(storyData.authorid);

    const token = generateToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.updateSharingData(storyId, email, token, expiresAt);

    const formattedContent = formatStoryContentForEmail(storyData.content || "");

    return {
      recipientEmail: email,
      storyTitle: storyData.title || "Histoire sans titre",
      storyContent: formattedContent,
      childrenNames: storyData.childrennames || [],
      storyObjective: storyData.objective || "",
      senderFirstName: userData?.firstname || "",
      senderLastName: userData?.lastname || "",
      publicUrl: `${window.location.origin}/stories/${storyId}?token=${token}`,
      expirationDate: expiresAt.toISOString()
    };
  }
};
