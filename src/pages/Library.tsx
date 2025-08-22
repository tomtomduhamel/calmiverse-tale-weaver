import React, { useState } from "react";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { useSupabaseChildren } from "@/hooks/useSupabaseChildren";
import { useSupabaseStories } from "@/hooks/stories/useSupabaseStories";
import { useStoryDeletion } from "@/hooks/stories/useStoryDeletion";
import { useStoryUpdate } from "@/hooks/stories/useStoryUpdate";
import { useStorySeries } from "@/hooks/stories/useStorySeries";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import StoryLibrary from "@/components/StoryLibrary";
import LoadingStory from "@/components/LoadingStory";
const Library: React.FC = () => {
  const {
    user,
    loading: authLoading
  } = useSupabaseAuth();
  const {
    children,
    loading: childrenLoading
  } = useSupabaseChildren();
  const {
    stories,
    isLoading: storiesLoading,
    fetchStories
  } = useSupabaseStories();
  const {
    deleteStory
  } = useStoryDeletion();
  const {
    updateStoryStatus
  } = useStoryUpdate();
  const {
    createSequel
  } = useStorySeries();
  const {
    toast
  } = useToast();
  const navigate = useNavigate();

  // États locaux pour gérer les actions
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [isUpdatingReadStatus, setIsUpdatingReadStatus] = useState(false);
  const handleSelectStory = (story: any) => {
    console.log("[Library] Navigation vers le lecteur:", story.id);
    navigate(`/reader/${story.id}`);
  };
  const handleDeleteStory = async (storyId: string) => {
    console.log("[Library] DEBUG: Début de la suppression pour l'histoire:", storyId);
    try {
      setIsDeletingId(storyId);
      console.log("[Library] DEBUG: Appel de deleteStory avec ID:", storyId);
      await deleteStory(storyId);
      console.log("[Library] DEBUG: Suppression réussie, rafraîchissement de la liste");
      // Rafraîchir la liste des histoires après suppression
      await fetchStories();
      toast({
        title: "Histoire supprimée",
        description: "L'histoire a été supprimée avec succès de votre bibliothèque"
      });
      console.log("[Library] DEBUG: Suppression terminée avec succès");
      
      // Rediriger vers la bibliothèque après suppression réussie
      navigate("/library");
    } catch (error: any) {
      console.error("[Library] ERROR: Erreur lors de la suppression:", error);
      toast({
        title: "Erreur de suppression",
        description: error?.message || "Impossible de supprimer l'histoire. Veuillez réessayer.",
        variant: "destructive"
      });
    } finally {
      setIsDeletingId(null);
    }
  };
  const handleRetryStory = async (storyId: string) => {
    console.log("[Library] DEBUG: Relance de l'histoire:", storyId);
    return true;
  };

  const handleMarkAsRead = async (storyId: string): Promise<boolean> => {
    console.log("[Library] DEBUG: Marquage comme lu de l'histoire:", storyId);
    try {
      setIsUpdatingReadStatus(true);
      
      await updateStoryStatus(storyId, "read");
      
      // Rafraîchir la liste des histoires
      await fetchStories();
      
      toast({
        title: "Histoire marquée comme lue",
        description: "L'histoire a été marquée comme lue avec succès"
      });
      
      return true;
    } catch (error: any) {
      console.error("[Library] ERROR: Erreur lors du marquage comme lu:", error);
      toast({
        title: "Erreur",
        description: error?.message || "Une erreur s'est produite",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsUpdatingReadStatus(false);
    }
  };
  const handleBack = () => {
    navigate("/");
  };
  const handleCreateStory = () => {
    navigate("/create-story-n8n");
  };

  const handleSequelCreated = async (storyId: string) => {
    console.log("[Library] DEBUG: Suite créée pour l'histoire:", storyId);
    try {
      // Rafraîchir la liste des histoires après création d'une suite
      await fetchStories();
      
      toast({
        title: "Suite créée avec succès",
        description: "La suite de l'histoire est en cours de génération"
      });
      
      console.log("[Library] DEBUG: Suite créée et liste rafraîchie");
    } catch (error: any) {
      console.error("[Library] ERROR: Erreur lors du rafraîchissement après création de suite:", error);
    }
  };
  if (authLoading || childrenLoading || storiesLoading) {
    return <LoadingStory />;
  }
  if (!user) {
    navigate("/auth");
    return null;
  }
  return <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* En-tête avec bouton retour */}
        <div className="mb-8">
          
          
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Bibliothèque d'histoires
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Retrouvez toutes vos histoires personnalisées et découvrez de nouvelles aventures
            </p>
          </div>
        </div>

        {/* Composant de bibliothèque d'histoires */}
        <div className="max-w-6xl mx-auto">
          <StoryLibrary 
            stories={stories} 
            onSelectStory={handleSelectStory} 
            onDeleteStory={handleDeleteStory} 
            onRetryStory={handleRetryStory} 
            onMarkAsRead={handleMarkAsRead}
            onSequelCreated={handleSequelCreated}
            onForceRefresh={fetchStories} 
            onCreateStory={handleCreateStory} 
            isDeletingId={isDeletingId}
            isUpdatingReadStatus={isUpdatingReadStatus}
          />
        </div>
      </div>
    </div>;
};
export default Library;