import React, { useState } from "react";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { useSupabaseChildren } from "@/hooks/useSupabaseChildren";
import { useSupabaseStories } from "@/hooks/stories/useSupabaseStories";
import { useStoryDeletion } from "@/hooks/stories/useStoryDeletion";
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
    toast
  } = useToast();
  const navigate = useNavigate();

  // État local pour gérer la suppression
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
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
  const handleBack = () => {
    navigate("/");
  };
  const handleCreateStory = () => {
    navigate("/create-story-n8n");
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
          <Button variant="ghost" onClick={handleBack} className="mb-4 text-muted-foreground hover:text-foreground">
            
            Retour à l'accueil
          </Button>
          
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
          <StoryLibrary stories={stories} onSelectStory={handleSelectStory} onDeleteStory={handleDeleteStory} onRetryStory={handleRetryStory} onForceRefresh={fetchStories} onCreateStory={handleCreateStory} isDeletingId={isDeletingId} />
        </div>
      </div>
    </div>;
};
export default Library;