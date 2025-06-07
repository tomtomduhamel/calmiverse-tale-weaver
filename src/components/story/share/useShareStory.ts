
import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { emailSharingService } from '@/services/emailSharingService';
import { useRobustKindleUpload } from '@/hooks/kindle/useRobustKindleUpload';

export const useShareStory = (storyId: string, onClose: () => void) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Utiliser le nouveau hook robuste pour Kindle
  const { 
    isUploading, 
    uploadProgress, 
    uploadToKindle, 
    resetProgress 
  } = useRobustKindleUpload();

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
    console.log('🚀 [ShareStory] Début partage Kindle robuste pour:', storyId);
    setError(null);
    
    const success = await uploadToKindle(storyId);
    
    if (!success) {
      setError("Échec de l'envoi vers Kindle après plusieurs tentatives");
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
