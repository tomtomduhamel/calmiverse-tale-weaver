
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
  onToggleFavorite?: (storyId: string, currentFavoriteStatus: boolean) => void;
  onViewChange?: (view: ViewType) => void;
  isRetrying?: boolean;
  isUpdatingFavorite?: boolean;
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
  onToggleFavorite,
  onViewChange,
  isRetrying = false,
  isUpdatingFavorite = false,
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

  // Gestion des favoris avec logs de débogage
  const handleToggleFavorite = useCallback(async (storyId: string, currentFavoriteStatus: boolean) => {
    if (onToggleFavorite) {
      try {
        console.log("[StoryLibrary] DEBUG: Toggle favori pour histoire:", storyId, "statut actuel:", currentFavoriteStatus);
        await onToggleFavorite(storyId, currentFavoriteStatus);
      } catch (error) {
        console.error("[StoryLibrary] ERROR: Erreur lors du toggle favori:", error);
      }
    } else {
      console.log("[StoryLibrary] DEBUG: Fonction onToggleFavorite non définie");
    }
  }, [onToggleFavorite]);

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
        onToggleFavorite={handleToggleFavorite}
        onViewChange={onViewChange}
        isRetrying={isRetrying}
        isUpdatingFavorite={isUpdatingFavorite}
        isDeletingId={isDeletingId}
        pendingStoryId={pendingStoryId}
        onCreateStory={onCreateStory}
      />
    </div>
  );
};

export default StoryLibrary;
