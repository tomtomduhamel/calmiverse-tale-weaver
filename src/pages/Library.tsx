
import React from "react";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { useSupabaseChildren } from "@/hooks/useSupabaseChildren";
import { useSupabaseStories } from "@/hooks/stories/useSupabaseStories";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import StoryLibrary from "@/components/StoryLibrary";
import LoadingStory from "@/components/LoadingStory";

const Library: React.FC = () => {
  const { user, loading: authLoading } = useSupabaseAuth();
  const { children, loading: childrenLoading } = useSupabaseChildren();
  const { stories, isLoading: storiesLoading, fetchStories } = useSupabaseStories();
  const navigate = useNavigate();

  const handleSelectStory = (story: any) => {
    // Naviguer vers la page de lecture avec l'ID de l'histoire
    navigate(`/?view=reader&story=${story.id}`);
  };

  const handleDeleteStory = async (storyId: string) => {
    // Logique de suppression d'histoire sera gérée par StoryLibrary
    console.log("Suppression de l'histoire:", storyId);
  };

  const handleRetryStory = async (storyId: string) => {
    // Logique de relance d'histoire sera gérée par StoryLibrary
    console.log("Relance de l'histoire:", storyId);
    return true;
  };

  const handleBack = () => {
    navigate("/");
  };

  if (authLoading || childrenLoading || storiesLoading) {
    return <LoadingStory />;
  }

  if (!user) {
    navigate("/auth");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* En-tête avec bouton retour */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="mb-4 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
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
          <StoryLibrary
            stories={stories}
            onSelectStory={handleSelectStory}
            onDeleteStory={handleDeleteStory}
            onRetryStory={handleRetryStory}
            onForceRefresh={fetchStories}
          />
        </div>
      </div>
    </div>
  );
};

export default Library;
