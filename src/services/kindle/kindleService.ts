
import { generateAndUploadEpub } from '../epubService';
import { kindleDataService } from './dataService';
import { kindleValidationService } from './validationService';
import { kindleWebhookService } from './webhookService';
import type { KindleShareData } from './types';

export const kindleService = {
  /**
   * Prépare les données pour l'envoi Kindle avec génération d'EPUB
   */
  async prepareKindleShareData(storyId: string): Promise<KindleShareData> {
    console.log('🔄 [KindleService] Préparation des données pour l\'envoi Kindle de l\'histoire:', storyId);
    
    try {
      // Récupérer les données complètes de l'histoire
      const story = await kindleDataService.getCompleteStoryData(storyId);
      
      // Vérification que l'authorId est présent
      if (!story.authorId) {
        console.error('❌ [KindleService] AuthorId manquant dans l\'histoire:', storyId);
        throw new Error("Impossible d'identifier l'auteur de cette histoire.");
      }
      
      const userData = await kindleDataService.getUserData(story.authorId);

      if (!userData?.kindle_email) {
        console.error('❌ [KindleService] Aucun email Kindle configuré pour l\'utilisateur:', story.authorId);
        throw new Error("Aucun email Kindle configuré. Veuillez configurer votre email Kindle dans les paramètres.");
      }

      if (!kindleValidationService.validateKindleEmail(userData.kindle_email)) {
        console.error('❌ [KindleService] Email Kindle invalide:', userData.kindle_email);
        throw new Error("L'email Kindle configuré n'est pas valide. Veuillez le corriger dans les paramètres.");
      }

      // Créer l'EPUB avec le bon champ 'content'
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
        content: story.content,
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
  },

  // Exposer les services individuels pour une utilisation directe si nécessaire
  dataService: kindleDataService,
  validationService: kindleValidationService,
  webhookService: kindleWebhookService
};
