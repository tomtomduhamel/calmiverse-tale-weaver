
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSupabaseStories } from "@/hooks/stories/useSupabaseStories";
import { useSupabaseChildren } from "@/hooks/useSupabaseChildren";
import { useStoryFavorites } from "@/hooks/stories/useStoryFavorites";
import StoryReader from "@/components/StoryReader";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import type { Story } from "@/types/story";

const StoryReaderPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { stories, updateStoryStatus, fetchStories } = useSupabaseStories();
  const { children } = useSupabaseChildren();
  const { toggleFavorite } = useStoryFavorites();
  const [currentStory, setCurrentStory] = useState<Story | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger l'histoire depuis l'ID dans l'URL
  useEffect(() => {
    if (!id) {
      setError("ID d'histoire manquant");
      setIsLoading(false);
      return;
    }

    if (stories && stories.length > 0) {
      const story = stories.find(s => s.id === id);
      if (story) {
        console.log("[StoryReaderPage] Histoire trouvée:", story.id);
        setCurrentStory(story);
        setError(null);
      } else {
        console.error("[StoryReaderPage] Histoire non trouvée:", id);
        setError("Histoire non trouvée");
      }
      setIsLoading(false);
    }
  }, [id, stories]);

  // Gestionnaire pour marquer comme lu/non lu (toggle)
  const handleMarkAsRead = async (storyId: string): Promise<boolean> => {
    try {
      console.log("[StoryReaderPage] DEBUG: Toggle read status pour story:", storyId);
      console.log("[StoryReaderPage] DEBUG: Current status:", currentStory?.status);
      
      // Calculer le nouveau statut (toggle entre read et completed)
      const currentStatus = currentStory?.status || "completed";
      const newStatus = currentStatus === "read" ? "completed" : "read";
      
      console.log("[StoryReaderPage] DEBUG: New status:", newStatus);
      
      await updateStoryStatus(storyId, newStatus);
      
      // Mettre à jour l'état local
      if (currentStory && currentStory.id === storyId) {
        setCurrentStory({
          ...currentStory,
          status: newStatus
        });
        console.log("[StoryReaderPage] DEBUG: Local state updated to:", newStatus);
      }
      
      return true;
    } catch (error) {
      console.error("[StoryReaderPage] Erreur lors du toggle read status:", error);
      return false;
    }
  };

  // Gestionnaire pour toggle favori
  const handleToggleFavorite = async (storyId: string) => {
    console.log("[StoryReaderPage] DEBUG: Toggle favori pour l'histoire:", storyId);
    try {
      if (currentStory) {
        const success = await toggleFavorite(storyId, currentStory.isFavorite || false);
        if (success) {
          // Mettre à jour l'état local
          setCurrentStory({
            ...currentStory,
            isFavorite: !currentStory.isFavorite
          });
          // Rafraîchir la liste des histoires
          await fetchStories();
          console.log("[StoryReaderPage] DEBUG: Favori mis à jour");
        }
      }
    } catch (error: any) {
      console.error("[StoryReaderPage] ERROR: Erreur lors du toggle favori:", error);
    }
  };

  // Gestionnaire pour fermer et retourner à la bibliothèque
  const handleClose = () => {
    console.log("[StoryReaderPage] Retour à la bibliothèque");
    navigate("/library");
  };

  // Trouver le nom de l'enfant pour l'affichage
  const getChildName = (childrenIds: string[]): string | undefined => {
    if (!childrenIds || childrenIds.length === 0 || !children || children.length === 0) {
      return undefined;
    }
    
    const childId = childrenIds[0];
    const child = children.find(c => c.id === childId);
    return child ? child.name : undefined;
  };

  // État de chargement
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement de l'histoire...</p>
        </div>
      </div>
    );
  }

  // État d'erreur
  if (error || !currentStory) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {error || "Histoire non disponible"}
          </h1>
          <p className="text-muted-foreground mb-6">
            L'histoire que vous cherchez n'existe pas ou n'est plus disponible.
          </p>
          <Button onClick={handleClose} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Retour à la bibliothèque
          </Button>
        </div>
      </div>
    );
  }

  return (
    <StoryReader
      story={currentStory}
      onClose={handleClose}
      onToggleFavorite={handleToggleFavorite}
      onMarkAsRead={handleMarkAsRead}
      childName={getChildName(currentStory.childrenIds)}
    />
  );
};

export default StoryReaderPage;
