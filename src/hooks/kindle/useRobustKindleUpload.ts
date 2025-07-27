
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { clientEpubGenerator } from '@/services/clientEpubGenerator';
import { robustStorageUpload } from '@/services/robustStorageUpload';
import { kindleSharingService } from '@/services/kindleSharingService';
import type { Story } from '@/types/story';

interface RobustUploadProgress {
  step: 'validating' | 'generating' | 'uploading' | 'sending' | 'completed' | 'error';
  progress: number;
  message: string;
  details?: string;
  bucketUsed?: string;
}

export const useRobustKindleUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<RobustUploadProgress | null>(null);
  const { toast } = useToast();

  const updateProgress = useCallback((update: Partial<RobustUploadProgress>) => {
    setUploadProgress(prev => prev ? { ...prev, ...update } : null);
  }, []);

  const uploadToKindle = useCallback(async (storyId: string): Promise<boolean> => {
    console.log('🚀 [RobustKindle] Début envoi robuste vers Kindle:', storyId);
    
    setIsUploading(true);
    setUploadProgress({
      step: 'validating',
      progress: 5,
      message: 'Validation des données...',
      details: 'Récupération de l\'histoire et vérification des paramètres'
    });

    try {
      // 1. Récupérer et valider les données
      const story = await kindleSharingService.getCompleteStoryData(storyId);
      const userData = await kindleSharingService.getUserData(story.authorId);

      if (!userData?.kindle_email) {
        throw new Error("Aucun email Kindle configuré. Veuillez configurer votre email Kindle dans les paramètres.");
      }

      if (!kindleSharingService.validateKindleEmail(userData.kindle_email)) {
        throw new Error("L'email Kindle configuré n'est pas valide.");
      }

      updateProgress({
        step: 'generating',
        progress: 20,
        message: 'Génération de l\'EPUB...',
        details: 'Création du fichier EPUB côté client avec JSZip'
      });

      // 2. Générer l'EPUB côté client
      const epubResult = await clientEpubGenerator.generateEpub(story);
      
      if (!epubResult.success || !epubResult.blob) {
        throw new Error(epubResult.error || 'Erreur génération EPUB');
      }

      updateProgress({
        step: 'uploading',
        progress: 50,
        message: 'Sélection du bucket optimal...',
        details: 'Recherche du meilleur bucket de stockage disponible'
      });

      // 3. Sélectionner automatiquement le meilleur bucket
      const selectedBucket = await robustStorageUpload.selectBestBucket();
      console.log('🎯 [RobustKindle] Bucket sélectionné:', selectedBucket);

      updateProgress({
        progress: 60,
        message: 'Upload vers le stockage...',
        details: `Envoi vers le bucket ${selectedBucket} avec système de fallback`
      });

      // 4. Upload vers Supabase Storage avec fallback automatique
      const cleanTitle = story.title.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, ' ').trim();
      const filename = `${cleanTitle}.epub`;
      
      const uploadResult = await robustStorageUpload.uploadFile(
        epubResult.blob,
        filename,
        selectedBucket
      );

      if (!uploadResult.success || !uploadResult.url) {
        throw new Error(uploadResult.error || 'Erreur upload Storage');
      }

      console.log('✅ [RobustKindle] Upload réussi avec bucket:', uploadResult.bucketUsed);

      updateProgress({
        step: 'sending',
        progress: 80,
        message: 'Envoi vers Kindle...',
        details: `Transmission à N8N (fichier uploadé dans ${uploadResult.bucketUsed})`,
        bucketUsed: uploadResult.bucketUsed
      });

      // 5. Préparer les données pour le webhook
      const objectiveText = typeof story.objective === 'string' 
        ? story.objective 
        : story.objective?.name || story.objective?.value || '';

      const webhookData = {
        firstname: userData.firstname || "",
        lastname: userData.lastname || "",
        title: story.title,
        content: story.content,
        childrennames: story.childrenNames || [],
        objective: objectiveText,
        kindleEmail: userData.kindle_email,
        epubUrl: uploadResult.url,
        epubFilename: filename
      };

      // 6. Envoyer au webhook N8N
      await kindleSharingService.sendToKindleWebhook(webhookData);

      updateProgress({
        step: 'completed',
        progress: 100,
        message: 'Envoi terminé avec succès!',
        details: `L'histoire "${story.title}" a été envoyée vers ${userData.kindle_email}`,
        bucketUsed: uploadResult.bucketUsed
      });

      toast({
        title: "Envoi Kindle réussi",
        description: `L'histoire a été envoyée vers votre Kindle (${userData.kindle_email})`,
      });

      console.log('✅ [RobustKindle] Envoi robuste terminé avec succès');
      return true;

    } catch (error) {
      console.error('❌ [RobustKindle] Erreur envoi robuste:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      
      updateProgress({
        step: 'error',
        progress: 0,
        message: 'Erreur d\'envoi',
        details: errorMessage
      });

      toast({
        title: "Erreur Kindle",
        description: errorMessage,
        variant: "destructive",
      });

      return false;
    } finally {
      setIsUploading(false);
    }
  }, [updateProgress, toast]);

  const resetProgress = useCallback(() => {
    setUploadProgress(null);
    setIsUploading(false);
  }, []);

  return {
    isUploading,
    uploadProgress,
    uploadToKindle,
    resetProgress
  };
};
