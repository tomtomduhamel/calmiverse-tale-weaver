
import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { emailSharingService } from '@/services/emailSharingService';
import { kindleSharingService } from '@/services/kindleSharingService';

export const useShareStory = (storyId: string, onClose: () => void) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Reset error when story ID changes
  useEffect(() => {
    setError(null);
  }, [storyId]);

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
      
      // Dispatch application-level notification
      const event = new CustomEvent('app-notification', {
        detail: {
          type: 'error',
          title: 'Erreur de partage',
          message: errorMessage
        }
      });
      document.dispatchEvent(event);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKindleShare = async () => {
    console.log('Début du partage Kindle avec génération EPUB pour l\'histoire:', storyId);
    setIsLoading(true);
    setError(null);
    
    try {
      // Préparer les données incluant la génération de l'EPUB
      const webhookData = await kindleSharingService.prepareKindleShareData(storyId);
      console.log('Données préparées pour l\'envoi Kindle avec EPUB:', {
        ...webhookData,
        content: `${webhookData.content.substring(0, 50)}...`, // Log tronqué
        epubFilename: webhookData.epubFilename,
        hasEpubUrl: !!webhookData.epubUrl
      });
      
      // Envoyer au webhook N8N avec l'EPUB inclus
      await kindleSharingService.sendToKindleWebhook(webhookData);

      toast({
        title: "Envoi Kindle réussi",
        description: `L'histoire "${webhookData.title}" a été convertie en EPUB et envoyée vers votre Kindle (${webhookData.kindleEmail})`,
      });
      onClose();
    } catch (error) {
      console.error('Erreur lors de l\'envoi Kindle:', error);
      const errorMessage = error instanceof Error ? error.message : "Impossible d'envoyer l'histoire vers Kindle";
      
      setError(errorMessage);
      
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
      
      // Dispatch application-level notification
      const event = new CustomEvent('app-notification', {
        detail: {
          type: 'error',
          title: 'Erreur Kindle',
          message: errorMessage
        }
      });
      document.dispatchEvent(event);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    email,
    setEmail,
    isLoading,
    error,
    handleEmailShare,
    handleKindleShare,
    clearError: () => setError(null)
  };
};
