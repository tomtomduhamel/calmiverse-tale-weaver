
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
  
  // Log state changes
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

  // Effacer les erreurs lorsque les champs changent - Mécanisme centralisé et robuste
  useEffect(() => {
    if (state.formError) {
      const erreurConcerneEnfants = state.formError.toLowerCase().includes('enfant');
      const erreurConcerneObjectifs = state.formError.toLowerCase().includes('objectif');
      
      // Vérifier si l'erreur doit être effacée en fonction de la sélection
      if ((erreurConcerneEnfants && state.selectedChildrenIds.length > 0) ||
          (erreurConcerneObjectifs && state.selectedObjective)) {
        console.log("[StoryFormContext] Effacement automatique de l'erreur suite à une sélection valide", {
          erreur: state.formError,
          erreurConcerneEnfants,
          erreurConcerneObjectifs,
          enfantsSelectionnes: state.selectedChildrenIds.length > 0,
          objectifSelectionne: !!state.selectedObjective
        });
        dispatch({ type: "SET_ERROR", error: null });
      }
    }
  }, [state.selectedChildrenIds, state.selectedObjective, state.formError]);
  
  // Gestion centralisée de la sélection d'enfant
  const handleChildSelect = useCallback((childId: string) => {
    console.log("[StoryFormContext] handleChildSelect appelé avec:", childId);
    
    if (!childId) {
      console.error("[StoryFormContext] ID d'enfant invalide:", childId);
      return;
    }
    
    // Vérifier que l'enfant existe dans les enfants disponibles
    const childExists = availableChildren.some(child => child.id === childId);
    if (!childExists) {
      console.error("[StoryFormContext] Enfant non trouvé dans la liste disponible:", childId);
      return;
    }
    
    dispatch({ type: "SELECT_CHILD", childId });
    
    // Effacer explicitement les erreurs liées à la sélection d'enfant
    if (state.formError && state.formError.toLowerCase().includes('enfant')) {
      console.log("[StoryFormContext] Effacement manuel de l'erreur liée à la sélection d'enfant");
      dispatch({ type: "SET_ERROR", error: null });
    }
  }, [availableChildren, state.formError]);
  
  // Gestion centralisée de la sélection d'objectif
  const handleObjectiveSelect = useCallback((objective: string) => {
    console.log("[StoryFormContext] handleObjectiveSelect appelé avec:", objective);
    dispatch({ type: "SELECT_OBJECTIVE", objective });
    
    // Effacer explicitement les erreurs liées à la sélection d'objectif
    if (state.formError && state.formError.toLowerCase().includes('objectif')) {
      console.log("[StoryFormContext] Effacement manuel de l'erreur liée à la sélection d'objectif");
      dispatch({ type: "SET_ERROR", error: null });
    }
  }, [state.formError]);
  
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
  
  // Gestion centralisée des erreurs
  const setError = useCallback((error: string | null) => {
    console.log("[StoryFormContext] setError appelé avec:", error);
    dispatch({ type: "SET_ERROR", error });
    
    // Notification d'erreur si nécessaire
    if (error) {
      notifyError("Erreur de validation", error);
    }
  }, [notifyError]);
  
  // Gestion de l'état de soumission
  const setIsSubmitting = useCallback((isSubmitting: boolean) => {
    console.log("[StoryFormContext] setIsSubmitting appelé avec:", isSubmitting);
    dispatch({ type: "SET_SUBMITTING", isSubmitting });
  }, []);
  
  // Logique de validation centralisée et unifiée
  const validateForm = useCallback(() => {
    console.log("[StoryFormContext] validateForm appelé", {
      nombreEnfantsSelectionnes: state.selectedChildrenIds.length,
      objectifSelectionne: !!state.selectedObjective,
      utilisateurConnecte: !!user
    });
    
    // Vérification de l'authentification
    if (!user) {
      const errorMsg = "Vous devez être connecté pour créer une histoire";
      console.error("[StoryFormContext] Validation échouée:", errorMsg);
      return { isValid: false, error: errorMsg };
    }
    
    // Vérification de la sélection d'enfant avec vérification explicite
    if (!state.selectedChildrenIds || state.selectedChildrenIds.length === 0) {
      const errorMsg = "Veuillez sélectionner au moins un enfant pour créer une histoire";
      console.error("[StoryFormContext] Validation échouée:", errorMsg, {
        selectedChildrenIds: state.selectedChildrenIds
      });
      return { isValid: false, error: errorMsg };
    }
    
    // Vérification de l'objectif
    if (!state.selectedObjective) {
      const errorMsg = "Veuillez sélectionner un objectif pour l'histoire";
      console.error("[StoryFormContext] Validation échouée:", errorMsg);
      return { isValid: false, error: errorMsg };
    }
    
    console.log("[StoryFormContext] Validation réussie");
    return { isValid: true, error: null };
  }, [state.selectedChildrenIds, state.selectedObjective, user]);
  
  // Gestionnaire de soumission du formulaire centralisé
  const handleFormSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[StoryFormContext] handleFormSubmit appelé");
    
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
  
  // Calcul de l'état du bouton
  const isGenerateButtonDisabled = state.isSubmitting || 
    state.selectedChildrenIds.length === 0 || 
    !state.selectedObjective;

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
