
import type { KindleShareData } from './types';
import { kindleValidationService } from './validationService';

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
      const response = await fetch(kindleWebhookUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'User-Agent': 'Calmiverse-App'
        },
        body: JSON.stringify(webhookData)
      });

      console.log('📡 [KindleWebhook] Réponse webhook N8N:', {
        status: response.status,
        statusText: response.statusText
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [KindleWebhook] Erreur webhook Kindle:', response.status, errorText);
        throw new Error(`Erreur webhook Kindle: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ [KindleWebhook] Réponse du webhook N8N Kindle:', result);
      return result;
    } catch (error) {
      console.error('💥 [KindleWebhook] Erreur lors de l\'envoi au webhook N8N:', error);
      throw error;
    }
  }
};
