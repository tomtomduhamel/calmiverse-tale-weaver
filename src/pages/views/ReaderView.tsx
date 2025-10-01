
import React, { useEffect, useState } from "react";
import StoryReader from "@/components/StoryReader";
import type { Story } from "@/types/story";
import { useAppNavigation } from "@/hooks/navigation/useAppNavigation";
import { useIsMobile } from "@/hooks/use-mobile";

interface ReaderViewProps {
  story: Story;
  onClose: () => void;
  onMarkAsRead?: (storyId: string) => Promise<boolean>;
}

/**
 * PHASE 2: ReaderView refactorisé pour utiliser useAppNavigation
 * Plus de useViewManagement - navigation unifiée
 */
export const ReaderView: React.FC<ReaderViewProps> = ({ story: initialStory, onClose, onMarkAsRead }) => {
  const { navigateToLibrary } = useAppNavigation();
  const isMobile = useIsMobile();
  const [story, setStory] = useState<Story>(initialStory);

  // Force le retour à la vue de la bibliothèque lors de la fermeture
  const handleClose = () => {
    console.log("[ReaderView] Fermeture du lecteur et retour à la bibliothèque");
    onClose();
    navigateToLibrary();
  };

  // Mettre à jour l'état local si l'histoire change
  useEffect(() => {
    setStory(initialStory);
  }, [initialStory]);

  // Gérer le marquage comme lu au niveau de la vue
  const handleMarkAsRead = async (storyId: string): Promise<boolean> => {
    if (onMarkAsRead) {
      const success = await onMarkAsRead(storyId);
      
      // Si le marquage comme lu a réussi, mettre à jour l'état local
      if (success) {
        setStory(prev => ({
          ...prev,
          status: 'read'
        }));
      }
      
      return success;
    }
    return false;
  };

  useEffect(() => {
    // Désactiver le scroll du corps quand le reader est ouvert
    document.body.style.overflow = 'hidden';
    
    // Log pour débogage
    console.log("[ReaderView] DEBUG: ReaderView affiché avec l'histoire:", initialStory.id);
    
    return () => {
      // Réactiver le scroll quand le reader est fermé
      document.body.style.overflow = '';
      console.log("[ReaderView] DEBUG: ReaderView démonté");
    };
  }, [initialStory.id]);

  // Le lecteur d'histoire doit occuper tout l'écran et être au-dessus des autres éléments
  return (
    <div className="fixed inset-0 z-50 bg-background">
      <StoryReader 
        story={story} 
        onClose={handleClose} 
        onMarkAsRead={handleMarkAsRead}
      />
    </div>
  );
};
