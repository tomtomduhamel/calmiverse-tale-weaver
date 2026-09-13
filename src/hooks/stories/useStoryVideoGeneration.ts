import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQuotaChecker } from '@/hooks/subscription/useQuotaChecker';
import { useQueryClient } from '@tanstack/react-query';
import type { Story } from '@/types/story';

export const useStoryVideoGeneration = () => {
  const { toast } = useToast();
  const { validateAction, incrementUsage } = useQuotaChecker();
  const queryClient = useQueryClient();
  const [generatingStoryIds, setGeneratingStoryIds] = useState<Record<string, boolean>>({});
  const timeoutRefs = useRef<Record<string, NodeJS.Timeout>>({});

  const stopGenerating = useCallback((storyId: string) => {
    if (timeoutRefs.current[storyId]) {
      clearTimeout(timeoutRefs.current[storyId]);
      delete timeoutRefs.current[storyId];
    }
    setGeneratingStoryIds(prev => ({ ...prev, [storyId]: false }));
  }, []);

  const generateVideoForStory = useCallback(async (story: Story) => {
    console.log("[useStoryVideoGeneration] 🎬 Demande de génération vidéo pour l'histoire:", story?.id, story?.title);
    if (!story || generatingStoryIds[story.id]) {
      console.warn("[useStoryVideoGeneration] Action annulée: histoire invalide ou déjà en cours");
      return false;
    }

    // 1. Vérifier si la vidéo existe déjà
    if (story.video_path) {
      toast({
        title: "Vidéo déjà existante",
        description: "Cette histoire dispose déjà d'une vidéo magique.",
      });
      return true;
    }

    if (!story.image_path) {
      toast({
        title: "Illustration requise",
        description: "Une illustration de couverture est nécessaire pour créer la vidéo magique.",
        variant: "destructive",
      });
      return false;
    }

    try {
      // 2. Valider le quota vidéo de l'utilisateur
      const validation = await validateAction('show_video_intro');
      if (!validation || !validation.allowed) {
        toast({
          title: "Quota vidéo atteint",
          description: validation?.reason || "Votre quota de vidéos magiques pour cette période est atteint.",
          variant: "destructive",
        });
        return false;
      }

      setGeneratingStoryIds(prev => ({ ...prev, [story.id]: true }));

      // Timeout de sécurité : si après 3 minutes rien n'est reçu, réinitialiser l'état
      if (timeoutRefs.current[story.id]) {
        clearTimeout(timeoutRefs.current[story.id]);
      }
      timeoutRefs.current[story.id] = setTimeout(() => {
        setGeneratingStoryIds(prev => ({ ...prev, [story.id]: false }));
      }, 180000);

      toast({
        title: "✨ Vidéo magique en préparation !",
        description: "La création de la vidéo a été lancée. Elle sera prête d'ici une trentaine de secondes.",
      });

      // 3. Appel de la fonction Supabase Edge
      const { data, error } = await supabase.functions.invoke('generate-story-video', {
        body: { storyId: story.id },
      });

      if (error) {
        throw new Error(error.message || "Erreur lors du lancement de la vidéo");
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      // 4. Incrémenter le compteur d'utilisation
      await incrementUsage('video_intro');

      // 5. Invalider les requêtes en cache
      queryClient.invalidateQueries({ queryKey: ['stories'] });
      queryClient.invalidateQueries({ queryKey: ['infinite-stories'] });
      queryClient.invalidateQueries({ queryKey: ['story', story.id] });

      return true;
    } catch (err: any) {
      console.error("[useStoryVideoGeneration] Erreur:", err);
      stopGenerating(story.id);
      toast({
        title: "Erreur de génération",
        description: err.message || "Impossible de générer la vidéo magique pour le moment.",
        variant: "destructive",
      });
      return false;
    }
  }, [generatingStoryIds, validateAction, incrementUsage, toast, queryClient, stopGenerating]);

  return {
    generateVideoForStory,
    isGeneratingVideo: (storyId: string) => !!generatingStoryIds[storyId],
    stopGenerating,
  };
};
