
import React, { createContext, useContext, useReducer, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import type { Child } from "@/types/child";
import type { Story } from "@/types/story";
import type { StoryFormState, StoryFormAction, StoryFormContextType, StoryFormProviderProps } from "./types";

// État initial
const initialState: StoryFormState = {
  selectedChildrenIds: [],
  selectedObjective: "",
  isSubmitting: false,
  formError: null,
  showChildForm: false,
  debugInfo: {}
};

// Réducteur pour gérer les changements d'état
function storyFormReducer(state: StoryFormState, action: StoryFormAction): StoryFormState {
  switch (action.type) {
    case "SELECT_CHILD":
      const isSelected = state.selectedChildrenIds.includes(action.childId);
      return {
        ...state,
        selectedChildrenIds: isSelected
          ? state.selectedChildrenIds.filter(id => id !== action.childId)
          : [...state.selectedChildrenIds, action.childId],
        formError: null // Effacer l'erreur lors de modification
      };
      
    case "SELECT_OBJECTIVE":
      return {
        ...state,
        selectedObjective: action.objective,
        formError: null
      };
      
    case "SET_SUBMITTING":
      return {
        ...state,
        isSubmitting: action.isSubmitting
      };
      
    case "SET_ERROR":
      return {
        ...state,
        formError: action.error
      };
      
    case "TOGGLE_CHILD_FORM":
      return {
        ...state,
        showChildForm: action.show
      };
      
    case "RESET_FORM":
      return {
        ...state,
        selectedChildrenIds: [],
        selectedObjective: "",
        formError: null,
        isSubmitting: false
      };
      
    case "UPDATE_DEBUG_INFO":
      return {
        ...state,
        debugInfo: { ...state.debugInfo, ...action.info }
      };
      
    default:
      return state;
  }
}

// Contexte
const StoryFormContext = createContext<StoryFormContextType | undefined>(undefined);

// Provider du contexte
export const StoryFormProvider: React.FC<StoryFormProviderProps> = ({
  children,
  onSubmit,
  availableChildren,
  onStoryCreated
}) => {
  const [state, dispatch] = useReducer(storyFormReducer, initialState);
  const { user, loading: authLoading } = useSupabaseAuth();
  const { toast } = useToast();
  
  // Fonction de validation
  const validateForm = useCallback(() => {
    if (!user) {
      return { isValid: false, error: "Vous devez être connecté" };
    }
    
    if (state.selectedChildrenIds.length === 0) {
      return { isValid: false, error: "Veuillez sélectionner au moins un enfant" };
    }
    
    if (!state.selectedObjective) {
      return { isValid: false, error: "Veuillez sélectionner un objectif" };
    }
    
    return { isValid: true, error: null };
  }, [user, state.selectedChildrenIds, state.selectedObjective]);
  
  // Gestionnaires d'actions
  const handleChildSelect = useCallback((childId: string) => {
    dispatch({ type: "SELECT_CHILD", childId });
  }, []);
  
  const handleObjectiveSelect = useCallback((objective: string) => {
    dispatch({ type: "SELECT_OBJECTIVE", objective });
  }, []);
  
  const setShowChildForm = useCallback((show: boolean) => {
    dispatch({ type: "TOGGLE_CHILD_FORM", show });
  }, []);
  
  const resetForm = useCallback(() => {
    dispatch({ type: "RESET_FORM" });
  }, []);
  
  const updateDebugInfo = useCallback((info: Record<string, any>) => {
    dispatch({ type: "UPDATE_DEBUG_INFO", info });
  }, []);
  
  const setError = useCallback((error: string | null) => {
    dispatch({ type: "SET_ERROR", error });
  }, []);
  
  // Soumission du formulaire
  const handleFormSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (state.isSubmitting) return;
    
    const validation = validateForm();
    if (!validation.isValid) {
      dispatch({ type: "SET_ERROR", error: validation.error });
      return;
    }
    
    try {
      dispatch({ type: "SET_SUBMITTING", isSubmitting: true });
      dispatch({ type: "SET_ERROR", error: null });
      
      const storyId = await onSubmit({
        childrenIds: state.selectedChildrenIds,
        objective: state.selectedObjective
      });
      
      if (storyId && onStoryCreated) {
        const tempStory: Story = {
          id: storyId,
          title: "Histoire en cours de génération",
          preview: "Génération en cours...",
          childrenIds: state.selectedChildrenIds,
          createdAt: new Date(),
          status: 'pending',
          content: "", // CORRECTION: utiliser 'content' au lieu de 'story_text'
          story_summary: "",
          objective: state.selectedObjective
        };
        
        onStoryCreated(tempStory);
      }
      
      dispatch({ type: "RESET_FORM" });
      
      toast({
        title: "Histoire créée",
        description: "Votre histoire est en cours de génération",
      });
      
      return storyId;
      
    } catch (error: any) {
      dispatch({ type: "SET_ERROR", error: error?.message || "Erreur lors de la création" });
      toast({
        title: "Erreur",
        description: error?.message || "Erreur lors de la création",
        variant: "destructive",
      });
    } finally {
      dispatch({ type: "SET_SUBMITTING", isSubmitting: false });
    }
  }, [state.isSubmitting, state.selectedChildrenIds, state.selectedObjective, validateForm, onSubmit, onStoryCreated, toast]);
  
  // Calculer si le bouton est désactivé
  const isGenerateButtonDisabled = state.isSubmitting || 
    state.selectedChildrenIds.length === 0 || 
    !state.selectedObjective;
  
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
    updateDebugInfo,
    setError,
    validateForm
  };
  
  return (
    <StoryFormContext.Provider value={contextValue}>
      {children}
    </StoryFormContext.Provider>
  );
};

// Hook pour utiliser le contexte
export const useStoryFormContext = () => {
  const context = useContext(StoryFormContext);
  if (context === undefined) {
    throw new Error("useStoryFormContext must be used within a StoryFormProvider");
  }
  return context;
};
