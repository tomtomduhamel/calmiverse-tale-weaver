
import React, { useState, useCallback } from "react";
import type { Story } from "@/types/story";
import type { ViewType } from "@/types/views";
import { useToast } from "@/hooks/use-toast";
import LibraryContainer from "./library/LibraryContainer";
import StoryRecoveryManager from "./story/StoryRecoveryManager";

interface StoryLibraryProps {
  stories: Story[];
  onSelectStory: (story: Story) => void;
  onDeleteStory?: (storyId: string) => void;
  onRetryStory?: (storyId: string) => void;
  onViewChange?: (view: ViewType) => void;
  isRetrying?: boolean;
  pendingStoryId?: string | null;
  onForceRefresh?: () => void;
  onCreateStory?: () => void;
  isDeletingId?: string | null;
}

const StoryLibrary: React.FC<StoryLibraryProps> = ({ 
  stories, 
  onSelectStory,
  onDeleteStory,
  onRetryStory,
  onViewChange,
  isRetrying = false,
  pendingStoryId,
  onForceRefresh,
  onCreateStory,
  isDeletingId
}) => {
  const { toast } = useToast();

  // Gestion de la suppression avec logs de débogage
  const handleDelete = useCallback(async (storyId: string) => {
    try {
      console.log("[StoryLibrary] DEBUG: Tentative de suppression de l'histoire:", storyId);
      
      if (onDeleteStory) {
        await onDeleteStory(storyId);
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
      // L'erreur est déjà gérée dans Library.tsx, pas besoin de toast ici
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

  const handleRecoveryComplete = useCallback(() => {
    console.log("[StoryLibrary] Récupération terminée, rafraîchissement des données");
    if (onForceRefresh) {
      onForceRefresh();
    }
  }, [onForceRefresh]);

  return (
    <div className="space-y-4">
      {/* Gestionnaire de récupération des histoires bloquées */}
      <StoryRecoveryManager 
        stories={stories}
        onRecoveryComplete={handleRecoveryComplete}
      />
      
      {/* Conteneur principal de la bibliothèque */}
      <LibraryContainer
        stories={stories}
        onSelectStory={onSelectStory}
        onDeleteStory={handleDelete}
        onRetryStory={handleRetry}
        onViewChange={onViewChange}
        isRetrying={isRetrying}
        isDeletingId={isDeletingId}
        pendingStoryId={pendingStoryId}
        onCreateStory={onCreateStory}
      />
    </div>
  );
};

export default StoryLibrary;
