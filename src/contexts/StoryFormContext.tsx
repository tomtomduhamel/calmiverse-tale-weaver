
import React, { createContext, useContext, useState, useReducer, useEffect } from "react";
import { useSupabaseAuth } from "./SupabaseAuthContext";
import type { Child } from "@/types/child";
import type { Story } from "@/types/story";
import { useToast } from "@/hooks/use-toast";

// Types for our state and actions
type StoryFormState = {
  selectedChildrenIds: string[];
  selectedObjective: string;
  isSubmitting: boolean;
  formError: string | null;
  showChildForm: boolean;
  debugInfo: Record<string, any>;
};

type StoryFormAction =
  | { type: "SELECT_CHILD"; childId: string }
  | { type: "SELECT_OBJECTIVE"; objective: string }
  | { type: "SET_SUBMITTING"; isSubmitting: boolean }
  | { type: "SET_ERROR"; error: string | null }
  | { type: "TOGGLE_CHILD_FORM"; show: boolean }
  | { type: "RESET_FORM" }
  | { type: "UPDATE_DEBUG_INFO"; info: Record<string, any> };

// Initial state
const initialState: StoryFormState = {
  selectedChildrenIds: [],
  selectedObjective: "",
  isSubmitting: false,
  formError: null,
  showChildForm: false,
  debugInfo: {},
};

// Reducer for state management
function storyFormReducer(state: StoryFormState, action: StoryFormAction): StoryFormState {
  console.log("[StoryFormContext] Action:", action.type, action);

  switch (action.type) {
    case "SELECT_CHILD": {
      const childId = action.childId;
      const isSelected = state.selectedChildrenIds.includes(childId);
      
      const selectedChildrenIds = isSelected
        ? state.selectedChildrenIds.filter(id => id !== childId)
        : [...state.selectedChildrenIds, childId];
        
      console.log("[StoryFormContext] Child selection updated:", {
        childId,
        isSelected,
        newSelection: selectedChildrenIds
      });

      return { ...state, selectedChildrenIds };
    }
    
    case "SELECT_OBJECTIVE":
      return { ...state, selectedObjective: action.objective };
      
    case "SET_SUBMITTING":
      return { ...state, isSubmitting: action.isSubmitting };
      
    case "SET_ERROR":
      return { ...state, formError: action.error };
      
    case "TOGGLE_CHILD_FORM":
      return { ...state, showChildForm: action.show };
      
    case "RESET_FORM":
      return { ...initialState };
      
    case "UPDATE_DEBUG_INFO":
      return { 
        ...state, 
        debugInfo: { ...state.debugInfo, ...action.info } 
      };
      
    default:
      return state;
  }
}

// Context type
interface StoryFormContextType {
  state: StoryFormState;
  handleChildSelect: (childId: string) => void;
  handleObjectiveSelect: (objective: string) => void;
  handleFormSubmit: (e: React.FormEvent) => Promise<string | undefined>;
  setShowChildForm: (show: boolean) => void;
  resetForm: () => void;
  isGenerateButtonDisabled: boolean;
  user: any;
  authLoading: boolean;
  updateDebugInfo: (info: Record<string, any>) => void;
}

// Create the context
const StoryFormContext = createContext<StoryFormContextType | undefined>(undefined);

// Provider component
interface StoryFormProviderProps {
  children: React.ReactNode;
  onSubmit: (formData: { childrenIds: string[], objective: string }) => Promise<string>;
  availableChildren: Child[];
  onStoryCreated: (story: Story) => void;
}

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
  const handleChildSelect = (childId: string) => {
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
  };
  
  // Handle objective selection
  const handleObjectiveSelect = (objective: string) => {
    console.log("[StoryFormContext] handleObjectiveSelect called with:", objective);
    dispatch({ type: "SELECT_OBJECTIVE", objective });
  };
  
  // Toggle child form
  const setShowChildForm = (show: boolean) => {
    console.log("[StoryFormContext] setShowChildForm called with:", show);
    dispatch({ type: "TOGGLE_CHILD_FORM", show });
  };
  
  // Reset form
  const resetForm = () => {
    console.log("[StoryFormContext] resetForm called");
    dispatch({ type: "RESET_FORM" });
  };
  
  // Update debug info
  const updateDebugInfo = (info: Record<string, any>) => {
    dispatch({ type: "UPDATE_DEBUG_INFO", info });
  };
  
  // Validate form
  const validateForm = () => {
    console.log("[StoryFormContext] validateForm called");
    
    // Authentication check
    if (!user) {
      return { isValid: false, error: "Vous devez être connecté pour créer une histoire" };
    }
    
    // Child selection check
    if (!state.selectedChildrenIds || state.selectedChildrenIds.length === 0) {
      console.error("[StoryFormContext] Validation failed: No children selected");
      return { isValid: false, error: "Veuillez sélectionner au moins un enfant pour créer une histoire" };
    }
    
    // Objective selection check
    if (!state.selectedObjective) {
      console.error("[StoryFormContext] Validation failed: No objective selected");
      return { isValid: false, error: "Veuillez sélectionner un objectif pour l'histoire" };
    }
    
    return { isValid: true, error: null };
  };
  
  // Handle form submission
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[StoryFormContext] handleFormSubmit called");
    
    // Don't allow multiple submissions
    if (state.isSubmitting) {
      console.warn("[StoryFormContext] Form already submitting, ignoring duplicate submission");
      return;
    }
    
    try {
      // Validate form
      const validation = validateForm();
      if (!validation.isValid) {
        console.error("[StoryFormContext] Form validation failed:", validation.error);
        dispatch({ type: "SET_ERROR", error: validation.error });
        toast({
          title: "Erreur de validation",
          description: validation.error || "Veuillez vérifier le formulaire",
          variant: "destructive"
        });
        return;
      }
      
      // Start submission
      console.log("[StoryFormContext] Form validation passed, starting submission");
      dispatch({ type: "SET_SUBMITTING", isSubmitting: true });
      dispatch({ type: "SET_ERROR", error: null });
      
      // Notify user
      toast({
        title: "Création en cours",
        description: "Nous préparons votre histoire, veuillez patienter..."
      });
      
      // Log data being submitted
      console.log("[StoryFormContext] Submitting data:", {
        childrenIds: state.selectedChildrenIds,
        objective: state.selectedObjective,
        childrenCount: state.selectedChildrenIds.length
      });
      
      updateDebugInfo({
        submissionTimestamp: new Date().toISOString(),
        submittedChildrenIds: [...state.selectedChildrenIds],
        submittedObjective: state.selectedObjective
      });
      
      // Call API
      const storyId = await onSubmit({
        childrenIds: state.selectedChildrenIds,
        objective: state.selectedObjective
      });
      
      console.log("[StoryFormContext] Story created successfully, ID:", storyId);
      
      // Success notification
      toast({
        title: "Histoire en préparation",
        description: "Votre histoire est en cours de génération, vous serez notifié(e) lorsqu'elle sera prête."
      });
      
      // Call success callback
      if (onStoryCreated && storyId) {
        onStoryCreated({
          id: storyId,
          title: "Histoire en cours de génération",
          preview: "Génération en cours...",
          childrenIds: state.selectedChildrenIds,
          createdAt: new Date(),
          status: 'pending',
          story_text: "",
          story_summary: "",
          objective: state.selectedObjective
        } as Story);
      }
      
      // Reset form
      resetForm();
      
      return storyId;
    } catch (error: any) {
      console.error("[StoryFormContext] Error during submission:", error);
      dispatch({ type: "SET_ERROR", error: error?.message || "Une erreur est survenue lors de la création de l'histoire" });
      
      toast({
        title: "Erreur",
        description: error?.message || "Une erreur est survenue pendant la création de l'histoire",
        variant: "destructive"
      });

      updateDebugInfo({
        errorTimestamp: new Date().toISOString(),
        errorMessage: error?.message || "Unknown error",
        errorStack: error?.stack || null
      });
    } finally {
      dispatch({ type: "SET_SUBMITTING", isSubmitting: false });
    }
  };
  
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
