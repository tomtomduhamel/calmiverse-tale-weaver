import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Send, Loader2, Book } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { doc, updateDoc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { generateToken } from '@/utils/tokenUtils';

interface ShareStoryDialogProps {
  storyId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ShareStoryDialog = ({ storyId, isOpen, onClose }: ShareStoryDialogProps) => {
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
      expiresAt.setDate(expiresAt.getDate() + 7); // Expire dans 7 jours

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

      // Ici, nous appellerons le webhook Make.com pour l'envoi d'email
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

      // Ici, nous appellerons le webhook Make.com pour l'envoi Kindle
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Partager l'histoire</DialogTitle>
          <DialogDescription>
            Choisissez comment vous souhaitez partager cette histoire
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <form onSubmit={handleEmailShare} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email du destinataire</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                required
              />
            </div>
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Envoyer par email
                </>
              )}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Ou</span>
            </div>
          </div>

          <Button
            onClick={handleKindleShare}
            disabled={isLoading}
            variant="outline"
            className="w-full"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Book className="mr-2 h-4 w-4" />
                Envoyer sur Kindle
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};