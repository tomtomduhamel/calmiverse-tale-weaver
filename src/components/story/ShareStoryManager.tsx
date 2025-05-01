
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Link, Copy, Loader2, X } from "lucide-react";
import { useStorySharing } from '@/hooks/stories/useStorySharing';
import { useToast } from '@/hooks/use-toast';

interface ShareStoryManagerProps {
  storyId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ShareStoryManager = ({ storyId, isOpen, onClose }: ShareStoryManagerProps) => {
  const [email, setEmail] = useState('');
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const { toast } = useToast();
  
  const {
    isLoading,
    shareByEmail,
    generatePublicLink,
    disablePublicAccess,
    isPublicEnabled
  } = useStorySharing(storyId);

  const handleEmailShare = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = await shareByEmail(email);
      setShareUrl(url);
      setEmail('');
    } catch (error) {
      console.error('Erreur lors du partage par email:', error);
    }
  };

  const handleGenerateLink = async () => {
    try {
      const url = await generatePublicLink();
      setShareUrl(url);
    } catch (error) {
      console.error('Erreur lors de la génération du lien:', error);
    }
  };

  const handleDisableSharing = async () => {
    try {
      await disablePublicAccess();
      setShareUrl(null);
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Partager cette histoire</DialogTitle>
          <DialogDescription>
            Partagez cette histoire avec vos proches ou générez un lien de partage
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <form onSubmit={handleEmailShare} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Partager par email</Label>
              <div className="flex gap-2">
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@exemple.com"
                  required
                  className="flex-1"
                />
                <Button type="submit" disabled={isLoading} className="whitespace-nowrap">
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4 mr-2" />}
                  Envoyer
                </Button>
              </div>
            </div>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Ou</span>
            </div>
          </div>

          {shareUrl ? (
            <div className="space-y-4">
              <Label>Lien de partage généré</Label>
              <div className="flex items-center gap-2">
                <Input value={shareUrl} readOnly className="flex-1 text-sm" />
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
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleDisableSharing}
                className="w-full"
              >
                <X className="h-4 w-4 mr-2" />
                Désactiver le partage
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={handleGenerateLink}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Link className="h-4 w-4 mr-2" />}
              Générer un lien de partage
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareStoryManager;
