
import { useCallback } from "react";
import type { StoryFormData } from "@/components/story/StoryFormTypes";

/**
 * Hook to handle form data updates and error management
 */
export const useStoryFormHandlers = (
  formData: StoryFormData,
  setFormData: React.Dispatch<React.SetStateAction<StoryFormData>>,
  error: string | null,
  setError: (error: string | null) => void
) => {
  // Use useCallback to avoid unnecessary renders
  const handleChildToggle = useCallback((childId: string) => {
    // Verify that childId is valid
    if (!childId || typeof childId !== 'string') {
      console.error("Invalid childId:", childId);
      return;
    }
    
    setFormData((prev) => {
      // Ensure we always have a valid array
      const currentIds = Array.isArray(prev.childrenIds) ? [...prev.childrenIds] : [];
      
      // Check if ID is already present
      const isSelected = currentIds.includes(childId);
      
      // Create new array with or without the ID
      const updatedIds = isSelected
        ? currentIds.filter((id) => id !== childId)
        : [...currentIds, childId];
      
      // Return new state with updated array
      return { 
        ...prev, 
        childrenIds: updatedIds 
      };
    });
    
    // Reset error if it concerns child selection
    if (error && error.toLowerCase().includes("enfant")) {
      setError(null);
    }
  }, [formData.childrenIds, error, setFormData, setError]);

  const setObjective = useCallback((objective: string) => {
    setFormData((prev) => ({ ...prev, objective }));
    
    // Reset error if it concerns objective
    if (error && error.toLowerCase().includes("objectif")) {
      setError(null);
    }
  }, [error, setFormData, setError]);

  const resetError = useCallback(() => setError(null), [setError]);

  return {
    handleChildToggle,
    setObjective,
    resetError
  };
};
