
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Share2, BookOpen } from "lucide-react";
import { ShareStoryDialog } from "../ShareStoryDialog";

interface UtilityButtonsProps {
  setShowReadingGuide: (show: boolean) => void;
  isDarkMode: boolean;
  storyId: string;
  title: string;
}

export const UtilityButtons: React.FC<UtilityButtonsProps> = ({
  setShowReadingGuide,
  isDarkMode,
  storyId,
  title
}) => {
  const [showShareDialog, setShowShareDialog] = useState(false);
  
  const buttonStyle = isDarkMode 
    ? "border-gray-600 text-white hover:bg-gray-700" 
    : "";

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setShowShareDialog(true)}
        className={`transition-transform hover:scale-105 ${buttonStyle}`}
      >
        <Share2 className="h-4 w-4 mr-2" />
        Partager
      </Button>
      <Button
        variant="outline"
        onClick={() => setShowReadingGuide(true)}
        className={`transition-transform hover:scale-105 ${buttonStyle}`}
      >
        <BookOpen className="h-4 w-4 mr-2" />
        Guide
      </Button>

      <ShareStoryDialog
        storyId={storyId}
        isOpen={showShareDialog}
        onClose={() => setShowShareDialog(false)}
      />
    </>
  );
};
