import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import { ShareStoryManager } from "../ShareStoryManager";

interface ShareStoryButtonProps {
  storyId: string;
  title: string;
  isDarkMode?: boolean;
}

export const ShareStoryButton: React.FC<ShareStoryButtonProps> = ({
  storyId,
  title,
  isDarkMode = false
}) => {
  const [showShareDialog, setShowShareDialog] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowShareDialog(true)}
        className={`${isDarkMode ? 'text-white hover:bg-gray-800' : ''}`}
      >
        <Share2 className="h-4 w-4" />
      </Button>

      <ShareStoryManager
        storyId={storyId}
        isOpen={showShareDialog}
        onClose={() => setShowShareDialog(false)}
      />
    </>
  );
};