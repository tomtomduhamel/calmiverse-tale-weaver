
import React, { useState, useCallback } from "react";
import type { Story } from "@/types/story";
import type { ViewType } from "@/types/views";
import { useToast } from "@/hooks/use-toast";
import LibraryContainer from "./library/LibraryContainer";

interface StoryLibraryProps {
  stories: Story[];
  onSelectStory: (story: Story) => void;
  onDeleteStory?: (storyId: string) => void;
  onRetryStory?: (storyId: string) => void;
  onViewChange?: (view: ViewType) => void;
  isRetrying?: boolean;
  pendingStoryId?: string | null;
}

const StoryLibrary: React.FC<StoryLibraryProps> = ({ 
  stories, 
  onSelectStory,
  onDeleteStory,
  onRetryStory,
  onViewChange,
  isRetrying = false,
  pendingStoryId
}) => {
  const { toast } = useToast();
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  // Gestion de la suppression avec logs de débogage
  const handleDelete = useCallback(async (storyId: string) => {
    try {
      console.log("[StoryLibrary] DEBUG: Tentative de suppression de l'histoire:", storyId);
      setIsDeletingId(storyId);
      
      if (onDeleteStory) {
        await onDeleteStory(storyId);
        toast({
          title: "Histoire supprimée",
          description: "L'histoire a été supprimée avec succès",
        });
      } else {
        console.error("[StoryLibrary] ERROR: Fonction onDeleteStory non définie");
        toast({
          title: "Erreur",
          description: "Impossible de supprimer l'histoire: fonction non disponible",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("[StoryLibrary] ERROR: Erreur lors de la suppression:", error);
      toast({
        title: "Erreur",
        description: error?.message || "Une erreur est survenue lors de la suppression",
        variant: "destructive",
      });
    } finally {
      setIsDeletingId(null);
    }
  }, [onDeleteStory, toast]);

  // Gestion de la relance avec logs de débogage
  const handleRetry = useCallback(async (storyId: string) => {
    if (onRetryStory) {
      try {
        console.log("[StoryLibrary] DEBUG: Tentative de relance de l'histoire:", storyId);
        await onRetryStory(storyId);
      } catch (error) {
        console.error("[StoryLibrary] ERROR: Erreur lors de la relance:", error);
      }
    } else {
      console.log("[StoryLibrary] DEBUG: Fonction onRetryStory non définie");
    }
  }, [onRetryStory]);

  return (
    <LibraryContainer
      stories={stories}
      onSelectStory={onSelectStory}
      onDeleteStory={handleDelete}
      onRetryStory={handleRetry}
      onViewChange={onViewChange}
      isRetrying={isRetrying}
      isDeletingId={isDeletingId}
      pendingStoryId={pendingStoryId}
    />
  );
};

export default StoryLibrary;
