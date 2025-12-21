import React, { useState, useEffect } from "react";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { useSupabaseChildren } from "@/hooks/useSupabaseChildren";
import { useSupabaseStories } from "@/hooks/stories/useSupabaseStories";
import { useStoryDeletion } from "@/hooks/stories/useStoryDeletion";
import { useStoryUpdate } from "@/hooks/stories/useStoryUpdate";
import { useStorySeries } from "@/hooks/stories/useStorySeries";
import { useStoryFavorites } from "@/hooks/stories/useStoryFavorites";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, BookOpen, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import StoryLibrary from "@/components/StoryLibrary";
import { PWAGestures } from "@/components/PWAGestures";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PendingSharesList from "@/components/story/share/PendingSharesList";
import { usePendingShares } from "@/hooks/stories/useStorySharing";
import { Badge } from "@/components/ui/badge";
const Library: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "stories";
  
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
    fetchStories,
    removeStoryFromList
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
    toggleFavorite,
    isUpdating: isUpdatingFavorite
  } = useStoryFavorites();
  const {
    pendingCount,
    refetch: refetchPendingShares
  } = usePendingShares();
  const {
    toast
  } = useToast();
  const navigate = useNavigate();

  // États locaux pour gérer les actions
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [isUpdatingReadStatus, setIsUpdatingReadStatus] = useState(false);

  // Gestion de l'événement de navigation depuis les notifications
  useEffect(() => {
    const handleCalmiNavigate = (event: CustomEvent) => {
      const { path, tab } = event.detail || {};
      if (path === "/library" && tab === "shared") {
        setSearchParams({ tab: "shared" });
      }
    };

    window.addEventListener("calmi-navigate", handleCalmiNavigate as EventListener);
    return () => {
      window.removeEventListener("calmi-navigate", handleCalmiNavigate as EventListener);
    };
  }, [setSearchParams]);

  const handleTabChange = (value: string) => {
    if (value === "stories") {
      setSearchParams({});
    } else {
      setSearchParams({ tab: value });
    }
  };

  const handleShareAccepted = async () => {
    // Rafraîchir les histoires et les partages en attente
    await Promise.all([fetchStories(), refetchPendingShares()]);
    toast({
      title: "Histoire ajoutée",
      description: "L'histoire partagée a été ajoutée à votre bibliothèque"
    });
  };
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
      console.log("[Library] DEBUG: Suppression réussie, mise à jour immédiate de l'UI");
      
      // Mise à jour optimiste immédiate de l'UI
      removeStoryFromList(storyId);
      
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

  const handleToggleFavorite = async (storyId: string, currentFavoriteStatus: boolean) => {
    console.log("[Library] DEBUG: Toggle favori pour l'histoire:", storyId, "statut actuel:", currentFavoriteStatus);
    try {
      const success = await toggleFavorite(storyId, currentFavoriteStatus);
      if (success) {
        // Rafraîchir la liste des histoires après mise à jour
        await fetchStories();
        console.log("[Library] DEBUG: Favori mis à jour et liste rafraîchie");
      }
    } catch (error: any) {
      console.error("[Library] ERROR: Erreur lors du toggle favori:", error);
    }
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
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }
  if (!user) {
    navigate("/auth");
    return null;
  }
  return (
    <PWAGestures onPullToRefresh={fetchStories} className="min-h-screen">
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 pwa-safe-area">
        <div className="container mx-auto px-4 py-8">
          {/* En-tête */}
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

          {/* Onglets Mes histoires / Partagées avec moi */}
          <div className="max-w-6xl mx-auto">
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-6">
                <TabsTrigger value="stories" className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Mes histoires
                </TabsTrigger>
                <TabsTrigger value="shared" className="flex items-center gap-2 relative">
                  <Share2 className="w-4 h-4" />
                  Partagées
                  {pendingCount > 0 && (
                    <Badge className="ml-1 bg-primary text-primary-foreground text-xs min-w-[1.2rem] h-5 px-1">
                      {pendingCount}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="stories">
                <StoryLibrary 
                  stories={stories} 
                  onSelectStory={handleSelectStory} 
                  onDeleteStory={handleDeleteStory} 
                  onRetryStory={handleRetryStory} 
                  onToggleFavorite={handleToggleFavorite}
                  onMarkAsRead={handleMarkAsRead}
                  onSequelCreated={handleSequelCreated}
                  onForceRefresh={fetchStories} 
                  onCreateStory={handleCreateStory} 
                  isDeletingId={isDeletingId}
                  isUpdatingReadStatus={isUpdatingReadStatus}
                  isUpdatingFavorite={isUpdatingFavorite}
                />
              </TabsContent>

              <TabsContent value="shared">
                <PendingSharesList onShareAccepted={handleShareAccepted} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </PWAGestures>
  );
};
export default Library;