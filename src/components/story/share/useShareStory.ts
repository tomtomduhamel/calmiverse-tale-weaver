import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { doc, updateDoc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { generateToken } from '@/utils/tokenUtils';

export const useShareStory = (storyId: string, onClose: () => void) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleEmailShare = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const storyRef = doc(db, 'stories', storyId);
      const storyDoc = await getDoc(storyRef);
      
      if (!storyDoc.exists()) {
        throw new Error("Histoire introuvable");
      }

      const token = generateToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await updateDoc(storyRef, {
        'sharing.publicAccess': {
          enabled: true,
          token,
          expiresAt: Timestamp.fromDate(expiresAt)
        },
        'sharing.sharedEmails': [{
          email,
          sharedAt: Timestamp.now(),
          accessCount: 0
        }]
      });

      const makeWebhookUrl = 'VOTRE_WEBHOOK_MAKE_COM';
      await fetch(makeWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storyId,
          recipientEmail: email,
          publicUrl: `${window.location.origin}/stories/${storyId}?token=${token}`,
          expirationDate: expiresAt.toISOString(),
          senderName: "Calmi"
        })
      });

      toast({
        title: "Histoire partagée",
        description: "Un email a été envoyé avec le lien de l'histoire",
      });
      onClose();
    } catch (error) {
      console.error('Erreur lors du partage:', error);
      toast({
        title: "Erreur",
        description: "Impossible de partager l'histoire",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKindleShare = async () => {
    setIsLoading(true);
    try {
      const storyRef = doc(db, 'stories', storyId);
      const storyDoc = await getDoc(storyRef);
      
      if (!storyDoc.exists()) {
        throw new Error("Histoire introuvable");
      }

      const makeWebhookUrl = 'VOTRE_WEBHOOK_MAKE_COM_KINDLE';
      await fetch(makeWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storyId,
          storyContent: storyDoc.data().story_text,
          title: storyDoc.data().title
        })
      });

      toast({
        title: "Envoi Kindle",
        description: "L'histoire a été envoyée à votre Kindle",
      });
      onClose();
    } catch (error) {
      console.error('Erreur lors de l\'envoi Kindle:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer l'histoire à votre Kindle",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    email,
    setEmail,
    isLoading,
    handleEmailShare,
    handleKindleShare
  };
};