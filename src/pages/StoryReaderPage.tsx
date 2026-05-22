
import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSupabaseStories } from "@/hooks/stories/useSupabaseStories";
import { useSupabaseChildren } from "@/hooks/useSupabaseChildren";
import { useStoryFavorites } from "@/hooks/stories/useStoryFavorites";
import StoryReader from "@/components/StoryReader";
import { ReadingSpeedProvider } from "@/contexts/ReadingSpeedContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCw } from "lucide-react";
import type { Story } from "@/types/story";
import { useUserSettings } from "@/hooks/settings/useUserSettings";
import { StoryVideoIntro } from "@/components/story/StoryVideoIntro";
import { getStoryVideoUrl } from "@/utils/supabaseImageUtils";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { supabase } from "@/integrations/supabase/client";
import { formatStoryFromSupabase } from "@/hooks/stories/storyFormatters";
import { usePWA } from "@/hooks/usePWA";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type ReaderError =
  | { kind: "invalid_id" }
  | { kind: "not_found" }
  | { kind: "network"; message?: string };

const StoryReaderPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { stories, updateStoryStatus, fetchStories } = useSupabaseStories();
  const { children } = useSupabaseChildren();
  const { toggleFavorite } = useStoryFavorites();
  const { userSettings } = useUserSettings();
  const [currentStory, setCurrentStory] = useState<Story | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ReaderError | null>(null);
  const [introPlayed, setIntroPlayed] = useState(false);
  const [forcePlayVideo, setForcePlayVideo] = useState(false);
  const introPlayedRef = useRef(false);
  const { user } = useSupabaseAuth();
  const hasLoggedRead = useRef(false);
  const prevVideoPathRef = useRef<string | null | undefined>(undefined);
  const { toast } = useToast();
  const { reloadApp, isReloading } = usePWA();
  const [retryTick, setRetryTick] = useState(0);
  const directFetchAttemptsRef = useRef<Record<string, number>>({});

  // Charger l'histoire depuis l'ID dans l'URL
  useEffect(() => {
    if (!id) {
      setError({ kind: "invalid_id" });
      setIsLoading(false);
      return;
    }

    // Valider le format UUID immédiatement
    if (!UUID_REGEX.test(id)) {
      console.error("[StoryReaderPage] ID invalide (pas un UUID):", id);
      setError({ kind: "invalid_id" });
      setIsLoading(false);
      return;
    }

    // 1) Chercher d'abord dans la liste déjà chargée
    if (stories && stories.length > 0) {
      const story = stories.find((s) => s.id === id);
      if (story) {
        console.log("[StoryReaderPage] Histoire trouvée en cache:", story.id);

        if (prevVideoPathRef.current === null && story.video_path) {
          toast({
            title: "🎬 Votre vidéo est prête !",
            description: "La magie a opéré, la vidéo d'introduction est disponible.",
            duration: 8000,
            action: (
              <ToastAction altText="Voir la vidéo" onClick={() => setForcePlayVideo(true)}>
                Regarder
              </ToastAction>
            ),
          });
        }
        prevVideoPathRef.current = story.video_path;

        setCurrentStory(story);
        setError(null);
        setIsLoading(false);
        return;
      }
    }

    // 2) Fallback : fetch direct par ID (cas où le cache global n'est pas hydraté)
    if (!user) {
      // Attendre que la session soit chargée
      return;
    }

    const MAX_RETRIES = 3;
    const RETRY_DELAY_MS = 2000;
    const attempts = directFetchAttemptsRef.current[id] || 0;

    if (attempts >= MAX_RETRIES) {
      // Toutes les tentatives épuisées
      return;
    }

    directFetchAttemptsRef.current[id] = attempts + 1;
    setIsLoading(true);

    (async () => {
      try {
        console.log(`[StoryReaderPage] Fallback fetch direct pour: ${id} (tentative ${attempts + 1}/${MAX_RETRIES})`);

        // Petit délai avant les retries pour laisser la session se stabiliser
        if (attempts > 0) {
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
        }

        const { data, error: fetchError } = await supabase
          .from("stories")
          .select("*")
          .eq("id", id)
          .maybeSingle();

        if (fetchError) {
          console.error("[StoryReaderPage] Erreur fetch direct:", fetchError);
          if (attempts + 1 < MAX_RETRIES) {
            // Planifier un retry via retryTick (déclenche le useEffect)
            setTimeout(() => setRetryTick(t => t + 1), RETRY_DELAY_MS);
            return;
          }
          setError({ kind: "network", message: fetchError.message });
          setIsLoading(false);
          return;
        }

        if (!data) {
          console.warn(`[StoryReaderPage] Histoire introuvable en base: ${id} (tentative ${attempts + 1}/${MAX_RETRIES})`);
          if (attempts + 1 < MAX_RETRIES) {
            // Pas encore trouvée, retenter (l'histoire est peut-être en cours de création)
            setTimeout(() => setRetryTick(t => t + 1), RETRY_DELAY_MS);
            return;
          }
          setError({ kind: "not_found" });
          setIsLoading(false);
          return;
        }

        // Succès
        directFetchAttemptsRef.current[id] = MAX_RETRIES; // Stopper les retries
        const formatted = formatStoryFromSupabase(data);
        setCurrentStory(formatted);
        setError(null);
        setIsLoading(false);

        // Rafraichir le cache global en arrière-plan
        fetchStories();
      } catch (err: any) {
        console.error("[StoryReaderPage] Exception fetch direct:", err);
        if (attempts + 1 < MAX_RETRIES) {
          setTimeout(() => setRetryTick(t => t + 1), RETRY_DELAY_MS);
          return;
        }
        setError({ kind: "network", message: err?.message });
        setIsLoading(false);
      }
    })();
  }, [id, stories, user, toast, fetchStories, retryTick]);

  // Enregistrer la lecture dans l'historique de l'utilisateur (gamification)
  useEffect(() => {
    if (currentStory && user && !hasLoggedRead.current) {
      hasLoggedRead.current = true;
      supabase.from('reading_history').insert({
        user_id: user.id,
        story_id: currentStory.id,
      }).then(({ error }) => {
        if (error) {
          console.error("[StoryReaderPage] Erreur lors de l'enregistrement de la lecture", error);
        } else {
          console.log("[StoryReaderPage] Lecture enregistrée dans reading_history pour le tableau de bord.");
        }
      });
    }
  }, [currentStory, user]);

  // Gestionnaire pour marquer comme lu/non lu (toggle)
  const handleMarkAsRead = async (storyId: string): Promise<boolean> => {
    try {
      const currentStatus = currentStory?.status || "completed";
      const newStatus = currentStatus === "read" ? "completed" : "read";

      await updateStoryStatus(storyId, newStatus);

      if (currentStory && currentStory.id === storyId) {
        setCurrentStory({
          ...currentStory,
          status: newStatus
        });
      }

      return true;
    } catch (error) {
      console.error("[StoryReaderPage] Erreur lors du toggle read status:", error);
      return false;
    }
  };

  // Gestionnaire pour toggle favori
  const handleToggleFavorite = async (storyId: string) => {
    try {
      if (currentStory) {
        const success = await toggleFavorite(storyId, currentStory.isFavorite || false);
        if (success) {
          setCurrentStory({
            ...currentStory,
            isFavorite: !currentStory.isFavorite
          });
          await fetchStories();
        }
      }
    } catch (error: any) {
      console.error("[StoryReaderPage] ERROR: Erreur lors du toggle favori:", error);
    }
  };

  // Gestionnaire pour fermer et retourner à la bibliothèque
  const handleClose = () => {
    navigate("/app/library");
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
          <p className="text-muted-foreground">📖 Ouverture de votre livre...</p>
        </div>
      </div>
    );
  }

  // État d'erreur
  if (error || !currentStory) {
    const title =
      error?.kind === "invalid_id"
        ? "Lien invalide"
        : error?.kind === "network"
          ? "Connexion impossible"
          : "Histoire non trouvée";
    const description =
      error?.kind === "invalid_id"
        ? "Le lien utilisé pour ouvrir cette histoire est incorrect."
        : error?.kind === "network"
          ? "Nous n'avons pas pu récupérer cette histoire. Vérifiez votre connexion et réessayez."
          : "Cette histoire n'existe plus ou vous n'y avez pas accès. Si vous venez de la créer, actualisez l'application.";

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center p-8 max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {title}
          </h1>
          <p className="text-muted-foreground mb-6">{description}</p>
          <div className="flex flex-col gap-3">
            <Button onClick={handleClose} className="flex items-center gap-2 justify-center">
              <ArrowLeft className="h-4 w-4" />
              Retour à la bibliothèque
            </Button>
            <Button
              variant="outline"
              onClick={() => reloadApp()}
              disabled={isReloading}
              className="flex items-center gap-2 justify-center"
            >
              <RefreshCw className={`h-4 w-4 ${isReloading ? "animate-spin" : ""}`} />
              {isReloading ? "Actualisation..." : "Actualiser l'application"}
            </Button>
          </div>
        </div>
      </div>
    );
  }


  // La lecture d'une vidéo déjà générée ne dépend pas du quota : le quota gouverne
  // uniquement la génération. Une vidéo dont le video_path existe est toujours lisible.
  const videoUrl = currentStory.video_path ? getStoryVideoUrl(currentStory.video_path) : null;

  const showVideoIntro =
    videoUrl &&
    ((userSettings.readingPreferences?.playVideoIntro !== false && !introPlayedRef.current) || forcePlayVideo);

  return (
    <ReadingSpeedProvider>
      {showVideoIntro && videoUrl ? (
        <StoryVideoIntro
          videoUrl={videoUrl}
          onComplete={() => {
            console.log("[StoryReaderPage] Video intro complete (quota tracking handled by DB trigger)");
            introPlayedRef.current = true;
            setIntroPlayed(true);
            setForcePlayVideo(false);
          }}
        />
      ) : (
        // Render nothing or a placeholder if no video intro, then StoryReader
        null
      )}
      <StoryReader
        story={currentStory}
        onClose={handleClose}
        onToggleFavorite={handleToggleFavorite}
        onMarkAsRead={handleMarkAsRead}
        childName={getChildName(currentStory.childrenIds)}
      />
    </ReadingSpeedProvider>
  );
};

export default StoryReaderPage;
