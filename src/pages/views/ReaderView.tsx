
import React, { useEffect } from "react";
import StoryReader from "@/components/StoryReader";
import type { Story } from "@/types/story";

interface ReaderViewProps {
  story: Story;
  onClose: () => void;
  onMarkAsRead?: (storyId: string) => Promise<boolean>;
}

export const ReaderView: React.FC<ReaderViewProps> = ({ story, onClose, onMarkAsRead }) => {
  useEffect(() => {
    // Désactiver le scroll du corps quand le reader est ouvert
    document.body.style.overflow = 'hidden';
    
    return () => {
      // Réactiver le scroll quand le reader est fermé
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div>
      <StoryReader 
        story={story} 
        onClose={onClose} 
        onMarkAsRead={onMarkAsRead}
      />
    </div>
  );
};
