
import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import type { Story } from "@/types/story";
import type { StoryFormData } from "@/components/story/StoryFormTypes";
import type { ViewType } from "@/types/views";

export const useStoryManagement = (
  createStory: (formData: StoryFormData, children?: any[]) => Promise<string>,
  deleteStory: (storyId: string) => Promise<any>,
  setCurrentView: (view: ViewType) => void
) => {
  const [currentStory, setCurrentStory] = useState<Story | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const { toast } = useToast();

  // Si l'histoire est en cours de génération, polling pour vérifier son statut
  useEffect(() => {
    let pollingInterval: ReturnType<typeof setInterval>;
    
    if (isGenerating && currentStory?.id) {
      console.log('[useStoryManagement] Polling for story status:', currentStory.id);
      
      pollingInterval = setInterval(() => {
        // Cette fonction sera implémentée plus tard pour vérifier le statut
        console.log('[useStoryManagement] Checking story status...');
      }, 5000);
    }
    
    return () => {
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, [isGenerating, currentStory]);

  const handleStorySubmit = useCallback(async (formData: StoryFormData): Promise<string> => {
    try {
      console.log('[useStoryManagement] Début de création avec:', formData);
      
      setIsGenerating(true);
      setGenerationError(null);
      
      // Validation explicite pour éviter les erreurs inexpliquées
      if (!formData.childrenIds || formData.childrenIds.length === 0) {
        throw new Error("Veuillez sélectionner au moins un enfant pour créer une histoire");
      }
      
      if (!formData.objective) {
        throw new Error("L'objectif de l'histoire est obligatoire");
      }
      
      const storyId = await createStory(formData);
      console.log("[useStoryManagement] Histoire créée avec l'ID:", storyId);
      
      toast({
        title: "Histoire en cours de génération",
        description: "Nous créons votre histoire personnalisée...",
      });
      
      return storyId;
    } catch (error: any) {
      console.error("[useStoryManagement] Erreur lors de la création de l'histoire:", error);
      setGenerationError(error instanceof Error ? error.message : "Une erreur est survenue");
      
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue",
        variant: "destructive",
      });
      throw error;
    }
  }, [createStory, toast]);

  const handleStoryCreated = useCallback((story: Story) => {
    console.log('[useStoryManagement] Histoire créée:', story);
    setCurrentStory(story);
    setIsGenerating(false);
    setCurrentView("reader");
    
    toast({
      title: "Histoire créée",
      description: "Votre histoire est maintenant prête à être lue!",
    });
  }, [setCurrentView, toast]);

  const handleCloseReader = useCallback(() => {
    setCurrentView("library");
    setCurrentStory(null);
  }, [setCurrentView]);

  const handleSelectStory = useCallback((story: Story) => {
    if (story.status === 'completed' || story.status === 'read') {
      setCurrentStory(story);
      setCurrentView("reader");
    } else if (story.status === 'pending') {
      toast({
        title: "Histoire en cours de génération",
        description: "Cette histoire est encore en cours de création, veuillez patienter...",
      });
    } else if (story.status === 'error') {
      toast({
        title: "Erreur de génération",
        description: "La génération de cette histoire a rencontré un problème. Vous pouvez réessayer.",
        variant: "destructive",
      });
    }
  }, [setCurrentView, toast]);

  const resetErrors = useCallback(() => {
    setGenerationError(null);
  }, []);

  return {
    currentStory,
    setCurrentStory,
    isGenerating,
    generationError,
    resetErrors,
    handleStorySubmit,
    handleStoryCreated,
    handleCloseReader,
    handleSelectStory,
  };
};
