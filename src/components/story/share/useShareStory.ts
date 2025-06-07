
import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { emailSharingService } from '@/services/emailSharingService';
import { kindleSharingService } from '@/services/kindleSharingService';
import { optimizedEpubService } from '@/services/optimizedEpubService';
import { useKindleUploadWithRetry } from '@/hooks/kindle/useKindleUploadWithRetry';

export const useShareStory = (storyId: string, onClose: () => void) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Hook pour l'upload avec retry
  const { uploadProgress, isUploading, uploadEpubWithRetry, resetProgress } = useKindleUploadWithRetry();

  // Reset error when story ID changes
  useEffect(() => {
    setError(null);
    resetProgress();
  }, [storyId, resetProgress]);

  const handleEmailShare = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const webhookData = await emailSharingService.prepareEmailShareData(storyId, email);
      await emailSharingService.sendToEmailWebhook(webhookData);

      toast({
        title: "Histoire partagée",
        description: "Un email a été envoyé avec le lien de l'histoire",
      });
      onClose();
    } catch (error) {
      console.error('Erreur lors du partage:', error);
      const errorMessage = error instanceof Error ? error.message : "Impossible de partager l'histoire";
      
      setError(errorMessage);
      
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKindleShare = async () => {
    console.log('🚀 [ShareStory] Début partage Kindle optimisé pour:', storyId);
    setIsLoading(true);
    setError(null);
    resetProgress();
    
    try {
      // Récupérer les données de l'histoire
      const story = await kindleSharingService.getCompleteStoryData(storyId);
      const userData = await kindleSharingService.getUserData(story.authorId);

      if (!userData?.kindle_email) {
        throw new Error("Aucun email Kindle configuré. Veuillez configurer votre email Kindle dans les paramètres.");
      }

      if (!kindleSharingService.validateKindleEmail(userData.kindle_email)) {
        throw new Error("L'email Kindle configuré n'est pas valide. Veuillez le corriger dans les paramètres.");
      }

      // Utiliser le service optimisé avec retry
      const epubUrl = await uploadEpubWithRetry(
        optimizedEpubService.formatStoryForKindle(story, story.content),
        story.title.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_'),
        {
          maxAttempts: 3,
          baseDelay: 2000,
          maxDelay: 15000,
          timeoutMs: 45000
        }
      );

      // Préparer les données pour le webhook N8N
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
        epubUrl,
        epubFilename: `${story.title.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_')}.epub`
      };

      // Envoyer au webhook N8N
      await kindleSharingService.sendToKindleWebhook(webhookData);

      toast({
        title: "Envoi Kindle réussi",
        description: `L'histoire "${story.title}" a été envoyée vers votre Kindle (${userData.kindle_email})`,
      });

    } catch (error) {
      console.error('❌ [ShareStory] Erreur envoi Kindle:', error);
      const errorMessage = error instanceof Error ? error.message : "Impossible d'envoyer l'histoire vers Kindle";
      
      setError(errorMessage);
      
      toast({
        title: "Erreur Kindle",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const retryKindleShare = async () => {
    resetProgress();
    await handleKindleShare();
  };

  return {
    email,
    setEmail,
    isLoading: isLoading || isUploading,
    error,
    uploadProgress,
    handleEmailShare,
    handleKindleShare,
    retryKindleShare,
    clearError: () => setError(null),
    resetProgress
  };
};
