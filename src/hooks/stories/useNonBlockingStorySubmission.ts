import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useBackgroundStoryGeneration } from './useBackgroundStoryGeneration';

interface NonBlockingStorySubmissionOptions {
  onSubmit: (formData: any) => Promise<string>;
  onSuccess?: (storyId: string) => void;
  redirectToLibrary?: boolean;
}

/**
 * Hook pour gérer la soumission d'histoires sans blocage de l'interface
 * L'utilisateur peut continuer à naviguer pendant la génération
 */
export const useNonBlockingStorySubmission = ({
  onSubmit,
  onSuccess,
  redirectToLibrary = false
}: NonBlockingStorySubmissionOptions) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { startGeneration } = useBackgroundStoryGeneration();

  const submitStory = useCallback(async (formData: any) => {
    if (isSubmitting) {
      console.log('[useNonBlockingStorySubmission] Soumission déjà en cours, ignorée');
      return null;
    }

    try {
      setIsSubmitting(true);
      
      console.log('[useNonBlockingStorySubmission] Démarrage de la soumission:', formData);
      
      // Créer l'histoire
      const storyId = await onSubmit(formData);
      
      if (storyId) {
        // Démarrer le suivi en arrière-plan
        startGeneration(storyId, 'Histoire en cours de génération');
        
        // Notification immédiate non-bloquante
        toast({
          title: "🚀 Génération lancée !",
          description: "Votre histoire se prépare en arrière-plan. Vous recevrez une notification quand elle sera prête."
        });
        
        // Callback de succès
        if (onSuccess) {
          onSuccess(storyId);
        }
        
        console.log('[useNonBlockingStorySubmission] Histoire créée avec succès:', storyId);
        return storyId;
      }
      
      return null;
    } catch (error: any) {
      console.error('[useNonBlockingStorySubmission] Erreur lors de la soumission:', error);
      
      toast({
        title: "Erreur de création",
        description: error?.message || "Impossible de créer l'histoire. Veuillez réessayer.",
        variant: "destructive"
      });
      
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, onSubmit, startGeneration, toast, onSuccess, redirectToLibrary]);

  return {
    submitStory,
    isSubmitting
  };
};