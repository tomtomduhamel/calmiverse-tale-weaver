import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Link, Copy, Loader2, X, Send, UserCheck, Globe } from "lucide-react";
import { useStorySharing } from '@/hooks/stories/useStorySharing';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ShareStoryManagerProps {
  storyId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ShareStoryManager = ({ storyId, isOpen, onClose }: ShareStoryManagerProps) => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [lastShareResult, setLastShareResult] = useState<{
    isCalmiUser: boolean;
    recipientName?: string;
  } | null>(null);
  const { toast } = useToast();
  
  const {
    isLoading,
    shareWithUser,
    shareByEmail,
    generatePublicLink,
    disablePublicAccess,
    isPublicEnabled
  } = useStorySharing(storyId);

  const handleEmailShare = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // D'abord essayer de partager avec un utilisateur Calmi
    const result = await shareWithUser(email, message || undefined);
    
    if (result.success) {
      if (result.is_calmi_user) {
        // Utilisateur Calmi trouvé - notification envoyée
        setLastShareResult({
          isCalmiUser: true,
          recipientName: result.recipient_name
        });
        setEmail('');
        setMessage('');
      } else {
        // Pas un utilisateur Calmi - utiliser le partage par email classique
        try {
          const url = await shareByEmail(email);
          setShareUrl(url || null);
          setLastShareResult({
            isCalmiUser: false
          });
          setEmail('');
          setMessage('');
        } catch (error) {
          console.error('Erreur lors du partage par email:', error);
        }
      }
    }
  };

  const handleGenerateLink = async () => {
    try {
      const url = await generatePublicLink();
      setShareUrl(url || null);
      setLastShareResult(null);
    } catch (error) {
      console.error('Erreur lors de la génération du lien:', error);
    }
  };

  const handleDisableSharing = async () => {
    try {
      await disablePublicAccess();
      setShareUrl(null);
      setLastShareResult(null);
    } catch (error) {
      console.error('Erreur lors de la désactivation du partage:', error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Lien copié",
        description: "Le lien de partage a été copié dans le presse-papier",
      });
    });
  };

  const handleClose = () => {
    setLastShareResult(null);
    setShareUrl(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Partager cette histoire</DialogTitle>
          <DialogDescription>
            Partagez cette histoire avec un utilisateur Calmi ou générez un lien public
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="calmi" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="calmi" className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Utilisateur Calmi
            </TabsTrigger>
            <TabsTrigger value="public" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Lien public
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calmi" className="space-y-4 pt-4">
            {lastShareResult?.isCalmiUser ? (
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 text-center">
                <UserCheck className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="font-medium text-primary">Invitation envoyée !</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {lastShareResult.recipientName} recevra une notification pour accepter l'histoire et l'ajouter à sa bibliothèque.
                </p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setLastShareResult(null)}
                >
                  Partager avec quelqu'un d'autre
                </Button>
              </div>
            ) : (
              <form onSubmit={handleEmailShare} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email du destinataire</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@exemple.com"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Si l'email correspond à un utilisateur Calmi, il recevra une notification. Sinon, un lien lui sera envoyé par email.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message (optionnel)</Label>
                  <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Ajouter un petit message pour accompagner votre histoire..."
                    rows={3}
                    className="resize-none"
                  />
                </div>

                <Button 
                  type="submit" 
                  disabled={isLoading} 
                  className="w-full"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Envoyer l'histoire
                </Button>
              </form>
            )}
          </TabsContent>

          <TabsContent value="public" className="space-y-4 pt-4">
            {shareUrl ? (
              <div className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-4">
                  <Label className="text-sm font-medium">Lien de partage</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Input 
                      value={shareUrl} 
                      readOnly 
                      className="flex-1 text-sm bg-background" 
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(shareUrl)}
                      className="shrink-0"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Ce lien permet à n'importe qui de lire l'histoire pendant 7 jours.
                  </p>
                </div>

                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDisableSharing}
                  className="w-full"
                >
                  <X className="h-4 w-4 mr-2" />
                  Désactiver le partage public
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-4">
                  <Globe className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-center text-muted-foreground">
                    Générez un lien public que vous pouvez partager avec n'importe qui, même s'ils n'ont pas de compte Calmi.
                  </p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGenerateLink}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Link className="h-4 w-4 mr-2" />
                  )}
                  Générer un lien de partage
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ShareStoryManager;
