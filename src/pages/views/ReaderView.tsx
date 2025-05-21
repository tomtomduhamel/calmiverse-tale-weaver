
import React, { useEffect } from "react";
import StoryReader from "@/components/StoryReader";
import type { Story } from "@/types/story";
import { useViewManagement } from "@/hooks/useViewManagement";

interface ReaderViewProps {
  story: Story;
  onClose: () => void;
  onMarkAsRead?: (storyId: string) => Promise<boolean>;
}

export const ReaderView: React.FC<ReaderViewProps> = ({ story, onClose, onMarkAsRead }) => {
  const { setCurrentView } = useViewManagement();

  // Force le retour à la vue de la bibliothèque lors de la fermeture
  const handleClose = () => {
    console.log("[ReaderView] DEBUG: Fermeture du lecteur et retour à la bibliothèque");
    onClose();
    setCurrentView("library");
  };

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
        onClose={handleClose} 
        onMarkAsRead={onMarkAsRead}
      />
    </div>
  );
};
