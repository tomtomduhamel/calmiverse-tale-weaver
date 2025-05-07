
import { useCallback, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { Child } from '@/types/child';
import type { Story } from '@/types/story';

/**
 * Hook for managing the handlers of the simplified story form
 */
export const useSimpleStoryFormHandlers = (
  selectedChildrenIds: string[],
  setSelectedChildrenIds: (ids: string[] | ((prev: string[]) => string[])) => void,
  selectedObjective: string,
  setSelectedObjective: (objective: string) => void,
  formError: string | null,
  setFormError: (error: string | null) => void,
  isSubmitting: boolean,
  setIsSubmitting: (isSubmitting: boolean) => void,
  validateForm: () => { isValid: boolean; error: string | null },
  onSubmit: (formData: { childrenIds: string[], objective: string }) => Promise<string>,
  onStoryCreated: (story: Story) => void
) => {
  const { toast } = useToast();

  // Child selection handler
  const handleChildSelect = useCallback((childId: string) => {
    if (!childId) return;
    
    console.log('[useSimpleStoryFormHandlers] Toggle child:', childId, 'Current selection:', selectedChildrenIds);
    
    // Fixed: Use the functional updater that returns a new array
    setSelectedChildrenIds((prev: string[]) => {
      const isSelected = prev.includes(childId);
      return isSelected 
        ? prev.filter(id => id !== childId) 
        : [...prev, childId];
    });
  }, [selectedChildrenIds, setSelectedChildrenIds]);

  // Objective selection handler
  const handleObjectiveSelect = useCallback((objective: string) => {
    console.log('[useSimpleStoryFormHandlers] Select objective:', objective);
    setSelectedObjective(objective);
  }, [setSelectedObjective]);

  // Form submission handler
  const handleFormSubmit = useCallback(async (event: React.FormEvent) => {
    // Prevent default form behavior
    event.preventDefault();
    
    console.log('[useSimpleStoryFormHandlers] Form submitted');
    
    if (isSubmitting) {
      console.log('[useSimpleStoryFormHandlers] Submission already in progress, cancelling');
      return;
    }

    try {
      // Validate the form
      const validation = validateForm();
      if (!validation.isValid) {
        console.error('[useSimpleStoryFormHandlers] Validation error:', validation.error);
        setFormError(validation.error);
        return;
      }

      // Start submission
      setIsSubmitting(true);
      setFormError(null);
      
      // Notify user
      toast({
        title: "Création en cours",
        description: "Nous préparons votre histoire, veuillez patienter...",
      });

      // Call the API
      const storyId = await onSubmit({
        childrenIds: selectedChildrenIds,
        objective: selectedObjective
      });
      
      console.log('[useSimpleStoryFormHandlers] Story created successfully, ID:', storyId);
      
      // Notify of intermediate success
      toast({
        title: "Histoire en préparation",
        description: "Votre histoire est en cours de génération, vous serez redirigé(e) lorsqu'elle sera prête.",
      });
      
      // Call success callback
      if (onStoryCreated) {
        onStoryCreated({
          id: storyId,
          // Temporary values while waiting for generation to complete
          title: "Histoire en cours de génération",
          preview: "Génération en cours...",
          childrenIds: selectedChildrenIds,
          createdAt: new Date(),
          status: 'pending',
          story_text: "",
          story_summary: "",
          objective: selectedObjective
        } as Story);
      }
      
      // Reset form
      setSelectedChildrenIds([]);
      setSelectedObjective('');
      
    } catch (error: any) {
      console.error('[useSimpleStoryFormHandlers] Error during creation:', error);
      setFormError(error?.message || "Une erreur est survenue lors de la création de l'histoire");
      
      toast({
        title: "Erreur",
        description: error?.message || "Une erreur est survenue pendant la création de l'histoire",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [
    isSubmitting, 
    validateForm, 
    selectedChildrenIds, 
    selectedObjective, 
    onSubmit, 
    onStoryCreated, 
    toast,
    setFormError,
    setIsSubmitting,
    setSelectedChildrenIds,
    setSelectedObjective
  ]);

  // Calculate button disabled state
  const isGenerateButtonDisabled = useMemo(() => {
    const disabled = isSubmitting || selectedChildrenIds.length === 0 || !selectedObjective;
    console.log('[useSimpleStoryFormHandlers] Button state:', { 
      disabled, 
      isSubmitting, 
      childrenSelected: selectedChildrenIds.length > 0, 
      objectiveSelected: !!selectedObjective 
    });
    return disabled;
  }, [isSubmitting, selectedChildrenIds, selectedObjective]);

  return {
    handleChildSelect,
    handleObjectiveSelect,
    handleFormSubmit,
    isGenerateButtonDisabled
  };
};
