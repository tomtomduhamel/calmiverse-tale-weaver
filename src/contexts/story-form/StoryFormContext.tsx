
import React, { createContext, useContext, useReducer, useEffect, useCallback } from "react";
import { useSupabaseAuth } from "../SupabaseAuthContext";
import { useToast } from "@/hooks/use-toast";

import { storyFormReducer, initialState } from "./storyFormReducer";
import { useFormValidation } from "./useFormValidation";
import { useFormSubmission } from "./useFormSubmission";
import { StoryFormContextType, StoryFormProviderProps } from "./types";

// Créer le contexte
const StoryFormContext = createContext<StoryFormContextType | undefined>(undefined);

// Provider component
export const StoryFormProvider: React.FC<StoryFormProviderProps> = ({
  children,
  onSubmit,
  availableChildren,
  onStoryCreated,
}) => {
  const [state, dispatch] = useReducer(storyFormReducer, initialState);
  const { user, loading: authLoading } = useSupabaseAuth();
  const { toast } = useToast();
  
  // Log state changes
  useEffect(() => {
    console.log("[StoryFormContext] State updated:", {
      selectedChildCount: state.selectedChildrenIds.length,
      selectedObjective: state.selectedObjective,
      isSubmitting: state.isSubmitting,
      formError: state.formError,
      showChildForm: state.showChildForm,
      userLoggedIn: !!user
    });
    
    // Update debug info
    updateDebugInfo({
      stateTimestamp: new Date().toISOString(),
      selectedChildrenIds: state.selectedChildrenIds,
      selectedChildCount: state.selectedChildrenIds.length,
      selectedObjective: state.selectedObjective,
      isSubmitting: state.isSubmitting,
      formError: state.formError,
      userLoggedIn: !!user,
      userEmail: user?.email || "non connecté"
    });

  }, [state, user]);

  // Clear errors when fields change
  useEffect(() => {
    if (state.formError) {
      if ((state.formError.toLowerCase().includes('enfant') && state.selectedChildrenIds.length > 0) ||
          (state.formError.toLowerCase().includes('objectif') && state.selectedObjective)) {
        dispatch({ type: "SET_ERROR", error: null });
      }
    }
  }, [state.selectedChildrenIds, state.selectedObjective, state.formError]);
  
  // Handle child selection
  const handleChildSelect = useCallback((childId: string) => {
    console.log("[StoryFormContext] handleChildSelect called with:", childId);
    
    // Validate childId
    if (!childId) {
      console.error("[StoryFormContext] Invalid childId:", childId);
      return;
    }
    
    // Check if child exists in available children
    const childExists = availableChildren.some(child => child.id === childId);
    if (!childExists) {
      console.error("[StoryFormContext] Child not found in available children:", childId);
      return;
    }
    
    dispatch({ type: "SELECT_CHILD", childId });
  }, [availableChildren]);
  
  // Handle objective selection
  const handleObjectiveSelect = useCallback((objective: string) => {
    console.log("[StoryFormContext] handleObjectiveSelect called with:", objective);
    dispatch({ type: "SELECT_OBJECTIVE", objective });
  }, []);
  
  // Toggle child form
  const setShowChildForm = useCallback((show: boolean) => {
    console.log("[StoryFormContext] setShowChildForm called with:", show);
    dispatch({ type: "TOGGLE_CHILD_FORM", show });
  }, []);
  
  // Reset form
  const resetForm = useCallback(() => {
    console.log("[StoryFormContext] resetForm called");
    dispatch({ type: "RESET_FORM" });
  }, []);
  
  // Update debug info
  const updateDebugInfo = useCallback((info: Record<string, any>) => {
    dispatch({ type: "UPDATE_DEBUG_INFO", info });
  }, []);
  
  // Set error handler
  const setError = useCallback((error: string | null) => {
    dispatch({ type: "SET_ERROR", error });
  }, []);
  
  // Set isSubmitting handler
  const setIsSubmitting = useCallback((isSubmitting: boolean) => {
    dispatch({ type: "SET_SUBMITTING", isSubmitting });
  }, []);
  
  // Form validation hook
  const { validateForm } = useFormValidation(
    state.selectedChildrenIds,
    state.selectedObjective,
    user
  );
  
  // Form submission hook
  const { handleFormSubmit } = useFormSubmission({
    selectedChildrenIds: state.selectedChildrenIds,
    selectedObjective: state.selectedObjective,
    isSubmitting: state.isSubmitting,
    setError,
    setIsSubmitting,
    resetForm,
    validateForm,
    onSubmit,
    onStoryCreated,
    updateDebugInfo
  });
  
  // Calculate button disabled state
  const isGenerateButtonDisabled = state.isSubmitting || 
    state.selectedChildrenIds.length === 0 || 
    !state.selectedObjective;

  // Provide context value
  const contextValue: StoryFormContextType = {
    state,
    handleChildSelect,
    handleObjectiveSelect,
    handleFormSubmit,
    setShowChildForm,
    resetForm,
    isGenerateButtonDisabled,
    user,
    authLoading,
    updateDebugInfo
  };
  
  return (
    <StoryFormContext.Provider value={contextValue}>
      {children}
    </StoryFormContext.Provider>
  );
};

// Custom hook to use the context
export const useStoryForm = () => {
  const context = useContext(StoryFormContext);
  
  if (context === undefined) {
    throw new Error("useStoryForm must be used within a StoryFormProvider");
  }
  
  return context;
};
