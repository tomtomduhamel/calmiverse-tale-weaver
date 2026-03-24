
import type { KindleShareData } from './types';
import { kindleValidationService } from './validationService';
import { supabase } from '@/integrations/supabase/client';

export const kindleWebhookService = {
  /**
   * Envoie les données au webhook N8N pour Kindle avec fichier EPUB
   */
  async sendToKindleWebhook(webhookData: KindleShareData) {
    console.log('🚀 [KindleWebhook] Début envoi webhook N8N pour Kindle');
    
    const kindleWebhookUrl = 'https://n8n.srv856374.hstgr.cloud/webhook/7bca54e0-e309-4c09-9aa3-83b205220d11';
    
    // Validation des données avant envoi
    if (!webhookData.epubUrl) {
      console.error('❌ [KindleWebhook] URL de l\'EPUB manquante');
      throw new Error("URL de l'EPUB manquante");
    }
    
    if (!kindleValidationService.validateKindleEmail(webhookData.kindleEmail)) {
      console.error('❌ [KindleWebhook] Email Kindle invalide:', webhookData.kindleEmail);
      throw new Error("Email Kindle invalide");
    }
    
    console.log('📤 [KindleWebhook] Envoi des données au webhook N8N Kindle:', {
      ...webhookData,
      content: `${webhookData.content.substring(0, 100)}...`,
      epubUrl: webhookData.epubUrl,
      epubFilename: webhookData.epubFilename
    });
    
    try {
      const { data: result, error: functionError } = await supabase.functions.invoke('trigger-n8n', {
        body: { targetUrl: kindleWebhookUrl, payload: webhookData }
      });

      if (functionError) {
        console.error('❌ [KindleWebhook] Erreur proxy webhook Kindle:', functionError);
        throw new Error(`Erreur proxy webhook Kindle: ${functionError.message}`);
      }

      if (result?.error) {
         console.error('❌ [KindleWebhook] Erreur n8n Kindle:', result.error);
         throw new Error(`Erreur webhook Kindle: ${result.error}`);
      }

      console.log('✅ [KindleWebhook] Réponse du webhook N8N Kindle via proxy:', result);
      return result;
    } catch (error) {
      console.error('💥 [KindleWebhook] Erreur lors de l\'envoi au webhook N8N via proxy:', error);
      throw error;
    }
  }
};
