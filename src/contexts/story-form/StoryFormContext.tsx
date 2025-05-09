
import React, { createContext, useContext, useReducer, useEffect, useCallback } from "react";
import { useSupabaseAuth } from "../SupabaseAuthContext";
import { useToast } from "@/hooks/use-toast";
import { useNotificationCenter } from "@/hooks/useNotificationCenter";

import { storyFormReducer, initialState } from "./storyFormReducer";
import { StoryFormContextType, StoryFormProviderProps } from "./types";
import type { Child } from "@/types/child";
import type { Story } from "@/types/story";

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
  const { notifyError, notifySuccess } = useNotificationCenter();
  
  // Log state changes with detailed information
  useEffect(() => {
    console.log("[StoryFormContext] État mis à jour:", {
      enfantsSelectionnes: state.selectedChildrenIds,
      nombreEnfantsSelectionnes: state.selectedChildrenIds.length,
      objectifSelectionne: state.selectedObjective,
      soumissionEnCours: state.isSubmitting,
      erreurFormulaire: state.formError,
      formulaireEnfantVisible: state.showChildForm,
      utilisateurConnecte: !!user
    });
  }, [state, user]);

  // Mécanisme AMÉLIORÉ pour effacer les erreurs lorsque les champs changent
  useEffect(() => {
    if (state.formError) {
      const errorText = state.formError.toLowerCase();
      const erreurConcerneEnfants = errorText.includes('enfant') || errorText.includes('child');
      const erreurConcerneObjectifs = errorText.includes('objectif');
      
      // Vérifier si l'erreur doit être effacée en fonction de la sélection
      if ((erreurConcerneEnfants && state.selectedChildrenIds.length > 0) ||
          (erreurConcerneObjectifs && state.selectedObjective)) {
        console.log("[StoryFormContext] EFFACEMENT AUTOMATIQUE de l'erreur suite à une sélection valide", {
          erreur: state.formError,
          erreurConcerneEnfants,
          erreurConcerneObjectifs,
          enfantsSelectionnes: state.selectedChildrenIds,
          objectifSelectionne: state.selectedObjective,
          timestamp: new Date().toISOString()
        });
        
        // Utiliser setTimeout pour garantir que l'effacement se produit après le rendu
        setTimeout(() => {
          dispatch({ type: "SET_ERROR", error: null });
        }, 0);
      }
    }
  }, [state.selectedChildrenIds, state.selectedObjective, state.formError]);
  
  // Gestion centralisée et améliorée de la sélection d'enfant
  const handleChildSelect = useCallback((childId: string) => {
    if (!childId) {
      console.error("[StoryFormContext] ID d'enfant invalide:", childId);
      return;
    }
    
    console.log("[StoryFormContext] handleChildSelect appelé avec:", {
      childId,
      selectionActuelle: state.selectedChildrenIds,
      timestamp: new Date().toISOString()
    });
    
    // Vérifier que l'enfant existe dans les enfants disponibles
    const childExists = availableChildren.some(child => child.id === childId);
    if (!childExists) {
      console.error("[StoryFormContext] Enfant non trouvé dans la liste disponible:", childId);
      return;
    }
    
    // Déterminer si l'enfant est déjà sélectionné
    const isAlreadySelected = state.selectedChildrenIds.includes(childId);
    console.log(`[StoryFormContext] Enfant ${isAlreadySelected ? 'déjà sélectionné' : 'pas encore sélectionné'}: ${childId}`);
    
    // Mettre à jour la sélection
    dispatch({ type: "SELECT_CHILD", childId });
    
    // Forcer l'effacement immédiat des erreurs liées à la sélection d'enfant
    if (state.formError && state.formError.toLowerCase().includes('enfant')) {
      console.log("[StoryFormContext] EFFACEMENT MANUEL IMMÉDIAT de l'erreur liée à la sélection d'enfant");
      dispatch({ type: "SET_ERROR", error: null });
    }
    
    return true;
  }, [availableChildren, state.formError, state.selectedChildrenIds]);
  
  // Gestion centralisée de la sélection d'objectif avec logs améliorés
  const handleObjectiveSelect = useCallback((objective: string) => {
    console.log("[StoryFormContext] handleObjectiveSelect appelé avec:", {
      objective,
      objectifPrecedent: state.selectedObjective,
      timestamp: new Date().toISOString()
    });
    
    dispatch({ type: "SELECT_OBJECTIVE", objective });
    
    // Effacer immédiatement les erreurs liées à la sélection d'objectif
    if (state.formError && state.formError.toLowerCase().includes('objectif')) {
      console.log("[StoryFormContext] EFFACEMENT MANUEL IMMÉDIAT de l'erreur liée à la sélection d'objectif");
      dispatch({ type: "SET_ERROR", error: null });
    }
  }, [state.formError, state.selectedObjective]);
  
  // Gestion du formulaire enfant
  const setShowChildForm = useCallback((show: boolean) => {
    console.log("[StoryFormContext] setShowChildForm appelé avec:", show);
    dispatch({ type: "TOGGLE_CHILD_FORM", show });
  }, []);
  
  // Réinitialisation du formulaire
  const resetForm = useCallback(() => {
    console.log("[StoryFormContext] resetForm appelé");
    dispatch({ type: "RESET_FORM" });
  }, []);
  
  // Mise à jour des informations de débogage
  const updateDebugInfo = useCallback((info: Record<string, any>) => {
    dispatch({ type: "UPDATE_DEBUG_INFO", info });
  }, []);
  
  // Gestion centralisée des erreurs avec notification améliorée
  const setError = useCallback((error: string | null) => {
    console.log("[StoryFormContext] setError appelé avec:", {
      error,
      stateActuel: {
        enfantsSelectionnes: state.selectedChildrenIds,
        nombreEnfantsSelectionnes: state.selectedChildrenIds.length,
        objectifSelectionne: state.selectedObjective
      },
      timestamp: new Date().toISOString()
    });
    
    dispatch({ type: "SET_ERROR", error });
    
    // Notification d'erreur si nécessaire
    if (error) {
      notifyError("Erreur de validation", error);
    }
  }, [notifyError, state.selectedChildrenIds, state.selectedObjective]);
  
  // Gestion de l'état de soumission
  const setIsSubmitting = useCallback((isSubmitting: boolean) => {
    console.log("[StoryFormContext] setIsSubmitting appelé avec:", isSubmitting);
    dispatch({ type: "SET_SUBMITTING", isSubmitting });
  }, []);
  
  // Logique de validation centralisée et améliorée
  const validateForm = useCallback(() => {
    console.log("[StoryFormContext] validateForm appelé", {
      nombreEnfantsSelectionnes: state.selectedChildrenIds.length,
      selectedChildrenIds: state.selectedChildrenIds,
      objectifSelectionne: !!state.selectedObjective,
      utilisateurConnecte: !!user,
      timestamp: new Date().toISOString()
    });
    
    // Vérification de l'authentification
    if (!user) {
      const errorMsg = "Vous devez être connecté pour créer une histoire";
      console.error("[StoryFormContext] Validation échouée:", errorMsg);
      return { isValid: false, error: errorMsg };
    }
    
    // Vérification de la sélection d'enfant avec vérification explicite et détaillée
    if (!state.selectedChildrenIds || state.selectedChildrenIds.length === 0) {
      const errorMsg = "Veuillez sélectionner au moins un enfant pour créer une histoire";
      console.error("[StoryFormContext] Validation échouée:", errorMsg, {
        selectedChildrenIds: state.selectedChildrenIds,
        isArray: Array.isArray(state.selectedChildrenIds),
        length: state.selectedChildrenIds ? state.selectedChildrenIds.length : 0
      });
      return { isValid: false, error: errorMsg };
    }
    
    // Vérification de l'objectif
    if (!state.selectedObjective) {
      const errorMsg = "Veuillez sélectionner un objectif pour l'histoire";
      console.error("[StoryFormContext] Validation échouée:", errorMsg);
      return { isValid: false, error: errorMsg };
    }
    
    console.log("[StoryFormContext] Validation réussie avec données:", {
      enfants: state.selectedChildrenIds,
      objectif: state.selectedObjective
    });
    return { isValid: true, error: null };
  }, [state.selectedChildrenIds, state.selectedObjective, user]);
  
  // Gestionnaire de soumission du formulaire centralisé avec logs améliorés
  const handleFormSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[StoryFormContext] handleFormSubmit appelé", {
      isSubmitting: state.isSubmitting,
      selectedChildrenIds: state.selectedChildrenIds,
      selectedObjective: state.selectedObjective,
      timestamp: new Date().toISOString()
    });
    
    if (state.isSubmitting) {
      console.log("[StoryFormContext] Soumission déjà en cours, annulation");
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Valider le formulaire
      const validation = validateForm();
      if (!validation.isValid) {
        setError(validation.error);
        return;
      }
      
      // Réinitialiser les erreurs si la validation réussit
      setError(null);
      
      // Notification de création en cours
      notifySuccess(
        "Création en cours", 
        "Nous préparons votre histoire, veuillez patienter..."
      );
      
      // Appeler la fonction de soumission
      const storyId = await onSubmit({
        childrenIds: state.selectedChildrenIds,
        objective: state.selectedObjective
      });
      
      console.log("[StoryFormContext] Histoire créée avec succès, ID:", storyId);
      
      // Notification de succès
      notifySuccess(
        "Histoire en préparation",
        "Votre histoire est en cours de génération, vous serez redirigé(e) lorsqu'elle sera prête."
      );
      
      // Créer une histoire temporaire pour la transition
      if (storyId && onStoryCreated) {
        const temporaryStory: Story = {
          id: storyId,
          title: "Histoire en cours de génération",
          preview: "Génération en cours...",
          childrenIds: state.selectedChildrenIds,
          createdAt: new Date(),
          status: 'pending',
          story_text: "",
          story_summary: "",
          objective: state.selectedObjective
        };
        
        onStoryCreated(temporaryStory);
      }
      
      // Réinitialiser le formulaire après soumission réussie
      resetForm();
      
      return storyId;
    } catch (error: any) {
      console.error("[StoryFormContext] Erreur pendant la création:", error);
      setError(error?.message || "Une erreur est survenue lors de la création de l'histoire");
      return undefined;
    } finally {
      setIsSubmitting(false);
    }
  }, [
    state.isSubmitting, 
    state.selectedChildrenIds, 
    state.selectedObjective,
    validateForm, 
    setError, 
    setIsSubmitting, 
    resetForm, 
    onSubmit, 
    onStoryCreated,
    notifySuccess
  ]);
  
  // Calcul de l'état du bouton avec logs explicites
  const isGenerateButtonDisabled = state.isSubmitting || 
    state.selectedChildrenIds.length === 0 || 
    !state.selectedObjective;
    
  useEffect(() => {
    console.log("[StoryFormContext] État du bouton:", {
      isDisabled: isGenerateButtonDisabled,
      isSubmitting: state.isSubmitting,
      childrenSelected: state.selectedChildrenIds.length > 0,
      objectiveSelected: !!state.selectedObjective
    });
  }, [isGenerateButtonDisabled, state.isSubmitting, state.selectedChildrenIds, state.selectedObjective]);

  // Valeur du contexte
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

// Hook personnalisé pour utiliser le contexte
export const useStoryForm = () => {
  const context = useContext(StoryFormContext);
  
  if (context === undefined) {
    throw new Error("useStoryForm doit être utilisé à l'intérieur d'un StoryFormProvider");
  }
  
  return context;
};
