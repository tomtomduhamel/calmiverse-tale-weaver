import React from 'react';
import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";

interface ShareStoryProps {
  storyId: string;
  title: string;
}

export const ShareStory: React.FC<ShareStoryProps> = ({ storyId, title }) => {
  const { toast } = useToast();

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/story/${storyId}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Histoire Calmi : ${title}`,
          text: "Découvre cette histoire personnalisée créée avec Calmi !",
          url: shareUrl,
        });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          copyToClipboard(shareUrl);
        }
      }
    } else {
      copyToClipboard(shareUrl);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Lien copié !",
        description: "Le lien de l'histoire a été copié dans le presse-papier.",
      });
    });
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            onClick={handleShare}
            className="transition-all hover:scale-105"
          >
            <Share2 className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Partager l'histoire</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};