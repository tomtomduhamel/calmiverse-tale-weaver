
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { ShareStoryManager } from './ShareStoryManager';

interface ShareStoryProps {
  storyId: string;
  title: string;
}

export const ShareStory: React.FC<ShareStoryProps> = ({ storyId, title }) => {
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleShare = () => {
    setShareDialogOpen(true);
  };

  return (
    <>
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
      
      <ShareStoryManager 
        storyId={storyId}
        isOpen={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
      />
    </>
  );
};
