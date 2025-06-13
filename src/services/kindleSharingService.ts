
// Service principal maintenant la compatibilité avec l'API existante
import { kindleService } from './kindle/kindleService';
import { kindleDataService } from './kindle/dataService';
import { kindleValidationService } from './kindle/validationService';
import { kindleWebhookService } from './kindle/webhookService';

// Ré-export des types pour la compatibilité
export type { KindleShareData } from './kindle/types';

// Service principal maintenant l'API existante
export const kindleSharingService = {
  getCompleteStoryData: kindleDataService.getCompleteStoryData,
  getUserData: kindleDataService.getUserData,
  validateKindleEmail: kindleValidationService.validateKindleEmail,
  sendToKindleWebhook: kindleWebhookService.sendToKindleWebhook,
  prepareKindleShareData: kindleService.prepareKindleShareData
};
