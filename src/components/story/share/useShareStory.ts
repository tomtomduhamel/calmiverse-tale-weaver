
import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { generateToken } from '@/utils/tokenUtils';

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
      const { data: storyData, error: storyError } = await supabase
        .from('stories')
        .select('*')
        .eq('id', storyId)
        .single();
      
      if (storyError || !storyData) {
        throw new Error("Histoire introuvable");
      }

      const token = generateToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      // Mettre à jour les données de partage dans Supabase
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

      // Données pour le webhook
      const webhookData = {
        storyId,
        recipientEmail: email,
        publicUrl: `${window.location.origin}/stories/${storyId}?token=${token}`,
        expirationDate: expiresAt.toISOString(),
        senderName: "Calmi"
      };

      // PLACEHOLDER: Remplacez cette URL par votre webhook Make.com réel dans votre environnement de production
      const makeWebhookUrl = import.meta.env.VITE_EMAIL_WEBHOOK_URL || 'PLACEHOLDER_EMAIL_WEBHOOK_URL';
      try {
        if (makeWebhookUrl && makeWebhookUrl !== 'PLACEHOLDER_EMAIL_WEBHOOK_URL') {
          await fetch(makeWebhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(webhookData)
          });
        } else {
          console.log('Email webhook URL not configured:', webhookData);
        }
      } catch (webhookError) {
        console.warn('Email webhook failed, but story was shared:', webhookError);
        // Continue execution even if webhook fails
      }

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
    setIsLoading(true);
    setError(null);
    
    try {
      const { data: storyData, error: storyError } = await supabase
        .from('stories')
        .select('*')
        .eq('id', storyId)
        .single();
      
      if (storyError || !storyData) {
        throw new Error("Histoire introuvable");
      }

      // Préparer les données pour Kindle
      const kindleData = {
        storyId,
        storyContent: storyData.content || "",
        title: storyData.title || "Histoire sans titre"
      };

      // PLACEHOLDER: Remplacez cette URL par votre webhook Make.com pour Kindle dans votre environnement de production
      const makeWebhookUrl = import.meta.env.VITE_KINDLE_WEBHOOK_URL || 'PLACEHOLDER_KINDLE_WEBHOOK_URL';
      try {
        if (makeWebhookUrl && makeWebhookUrl !== 'PLACEHOLDER_KINDLE_WEBHOOK_URL') {
          await fetch(makeWebhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(kindleData)
          });
        } else {
          console.log('Kindle webhook URL not configured:', kindleData);
        }
      } catch (webhookError) {
        console.error('Kindle webhook failed:', webhookError);
        throw new Error("Échec de l'envoi à Kindle");
      }

      toast({
        title: "Envoi Kindle",
        description: "L'histoire a été envoyée à votre Kindle",
      });
      onClose();
    } catch (error) {
      console.error('Erreur lors de l\'envoi Kindle:', error);
      const errorMessage = error instanceof Error ? error.message : "Impossible d'envoyer l'histoire à votre Kindle";
      
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
