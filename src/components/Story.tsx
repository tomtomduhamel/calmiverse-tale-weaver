
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import StoryForm from "./StoryForm";
import { useStories } from "@/hooks/useStories";
import { useChildren } from "@/hooks/useChildren";
import StoryReader from "./StoryReader";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import StoryLibrary from "./StoryLibrary";
import LoadingStory from "./LoadingStory";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, ArrowLeft } from "lucide-react";

type View = "create" | "read" | "library";

const Story = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { children } = useChildren();
  const { toast } = useToast();
  const [view, setView] = useState<View>("library");
  const {
    stories,
    currentStory,
    setCurrentStory,
    createStory,
    deleteStory,
    retryFailedStory,
    lastError,
    isRetrying,
    clearError
  } = useStories(children);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [storyToDelete, setStoryToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) {
      navigate("/");
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    // Reset view when stories change to prevent showing a no-longer-existent story
    if (view === "read" && !currentStory) {
      setView("library");
    }
  }, [stories, currentStory, view]);

  const handleStoryCreated = (storyId: string) => {
    console.log("Story created with ID:", storyId);
    setView("library");
  };

  const handleCreateStory = async (formData: { childrenIds: string[], objective: string }) => {
    try {
      const storyId = await createStory(formData);
      return storyId;
    } catch (error) {
      console.error("Error in handleCreateStory:", error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleSelectStory = (story) => {
    setCurrentStory(story);
    setView("read");
  };

  const handleDeleteClick = (storyId: string) => {
    setStoryToDelete(storyId);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (storyToDelete) {
      await deleteStory(storyToDelete);
      if (currentStory && currentStory.id === storyToDelete) {
        setCurrentStory(null);
        setView("library");
      }
      setShowDeleteConfirm(false);
      setStoryToDelete(null);
    }
  };

  const handleRetry = async (storyId: string) => {
    try {
      await retryFailedStory(storyId);
      toast({
        title: "Nouvelle tentative",
        description: "Nous réessayons de générer votre histoire",
      });
    } catch (error) {
      console.error("Error retrying story:", error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue",
        variant: "destructive",
      });
    }
  };

  const renderView = () => {
    if (stories.isLoading) {
      return <LoadingStory />;
    }

    switch (view) {
      case "create":
        return (
          <div className="max-w-7xl mx-auto pt-2 pb-10">
            <button
              onClick={() => setView("library")}
              className="flex items-center text-primary hover:text-primary/80 mb-5"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour à la bibliothèque
            </button>
            
            {lastError && (
              <Alert variant="destructive" className="mb-5">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Erreur de génération</AlertTitle>
                <AlertDescription>
                  {lastError}
                  <button 
                    onClick={clearError}
                    className="ml-2 underline text-sm"
                  >
                    Fermer
                  </button>
                </AlertDescription>
              </Alert>
            )}
            
            <StoryForm
              onSubmit={handleCreateStory}
              children={children}
              onCreateChild={null}
              onStoryCreated={handleStoryCreated}
            />
          </div>
        );
      case "read":
        return (
          <div className="w-full">
            {currentStory && (
              <StoryReader
                story={currentStory}
                onBack={() => setView("library")}
              />
            )}
          </div>
        );
      case "library":
      default:
        return (
          <StoryLibrary
            stories={stories.stories || []}
            onSelectStory={handleSelectStory}
            onDeleteStory={handleDeleteClick}
            onViewChange={setView}
            onRetryStory={handleRetry}
            isRetrying={isRetrying}
          />
        );
    }
  };

  return (
    <div className="flex-1 overflow-auto pb-20 pt-8">
      {renderView()}

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr de vouloir supprimer cette histoire ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. L'histoire sera définitivement supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-500 hover:bg-red-600">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Story;
