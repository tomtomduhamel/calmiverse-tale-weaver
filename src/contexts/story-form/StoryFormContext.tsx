
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
  const { toast } = useToast();
  const { notifyError, notifySuccess } = useNotificationCenter();
  
  // Log précis de l'état au montage et à chaque changement majeur
  useEffect(() => {
    console.log("[StoryFormContext] Provider monté avec:", {
      childrenDisponibles: availableChildren?.length || 0,
      utilisateur: user?.id || "non connecté",
      enChargement: authLoading
    });
  }, []);
  
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
    
    // Mettre à jour la sélection via le reducer
    dispatch({ type: "SELECT_CHILD", childId });
    
    // Force l'effacement des erreurs liées à la sélection d'enfant
    if (state.formError && (state.formError.toLowerCase().includes('enfant') || state.formError.toLowerCase().includes('child'))) {
      console.log("[StoryFormContext] Effacement proactif de l'erreur liée aux enfants");
      dispatch({ type: "SET_ERROR", error: null });
    }
    
    return true;
  }, [availableChildren, state.selectedChildrenIds, state.formError]);
  
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
      console.log("[StoryFormContext] Effacement proactif de l'erreur liée à l'objectif");
      dispatch({ type: "SET_ERROR", error: null });
    }
  }, [state.selectedObjective, state.formError]);
  
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
      }
    });
    
    // Vérifier si l'erreur concerne les enfants mais nous avons déjà des enfants sélectionnés
    if (error && 
        (error.toLowerCase().includes('enfant') || error.toLowerCase().includes('child')) &&
        state.selectedChildrenIds.length > 0) {
      console.log("[StoryFormContext] Erreur enfant ignorée car des enfants sont déjà sélectionnés");
      return;
    }
    
    // Vérifier si l'erreur concerne l'objectif mais nous avons déjà un objectif sélectionné
    if (error && 
        error.toLowerCase().includes('objectif') && 
        state.selectedObjective) {
      console.log("[StoryFormContext] Erreur objectif ignorée car un objectif est déjà sélectionné");
      return;
    }
    
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
  
  // Logique de validation centralisée et améliorée avec journalisation détaillée
  const validateForm = useCallback(() => {
    console.log("[StoryFormContext] validateForm appelé", {
      nombreEnfantsSelectionnes: state.selectedChildrenIds.length,
      selectedChildrenIds: JSON.stringify(state.selectedChildrenIds),
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
    
    // Vérification de la sélection d'enfant avec validation robuste
    if (!state.selectedChildrenIds || !Array.isArray(state.selectedChildrenIds)) {
      const errorMsg = "Erreur technique: la sélection des enfants n'est pas valide";
      console.error("[StoryFormContext] Validation échouée:", errorMsg, {
        selectedChildrenIds: state.selectedChildrenIds,
        type: typeof state.selectedChildrenIds
      });
      return { isValid: false, error: errorMsg };
    }
    
    if (state.selectedChildrenIds.length === 0) {
      const errorMsg = "Veuillez sélectionner au moins un enfant pour créer une histoire";
      console.error("[StoryFormContext] Validation échouée:", errorMsg);
      return { isValid: false, error: errorMsg };
    }
    
    // Vérification des IDs d'enfants invalides
    const invalidChildIds = state.selectedChildrenIds.filter(
      id => !availableChildren.some(child => child.id === id)
    );
    
    if (invalidChildIds.length > 0) {
      const errorMsg = `Certains enfants sélectionnés n'existent pas (${invalidChildIds.join(", ")})`;
      console.error("[StoryFormContext] Validation échouée:", errorMsg);
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
  }, [state.selectedChildrenIds, state.selectedObjective, user, availableChildren]);
  
  // Gestionnaire de soumission du formulaire centralisé avec logs améliorés
  const handleFormSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[StoryFormContext] handleFormSubmit appelé", {
      isSubmitting: state.isSubmitting,
      selectedChildrenIds: JSON.stringify(state.selectedChildrenIds),
      selectedObjective: state.selectedObjective
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
        console.error("[StoryFormContext] Échec de la validation:", validation.error);
        setError(validation.error);
        setIsSubmitting(false);
        return;
      }
      
      // Réinitialiser les erreurs si la validation réussit
      if (state.formError) {
        setError(null);
      }
      
      // Notification de création en cours
      toast({
        title: "Création en cours", 
        description: "Nous préparons votre histoire, veuillez patienter..."
      });
      
      // Appeler la fonction de soumission
      console.log("[StoryFormContext] Appel à onSubmit avec:", {
        childrenIds: state.selectedChildrenIds,
        objective: state.selectedObjective
      });
      
      const storyId = await onSubmit({
        childrenIds: state.selectedChildrenIds,
        objective: state.selectedObjective
      });
      
      console.log("[StoryFormContext] Histoire créée avec succès, ID:", storyId);
      
      // Notification de succès
      toast({
        title: "Histoire en préparation",
        description: "Votre histoire est en cours de génération, vous serez redirigé(e) lorsqu'elle sera prête."
      });
      
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
    state.formError,
    validateForm, 
    setError, 
    setIsSubmitting, 
    resetForm, 
    onSubmit, 
    onStoryCreated,
    toast
  ]);
  
  // Calcul de l'état du bouton avec logs explicites
  const isGenerateButtonDisabled = state.isSubmitting || 
    state.selectedChildrenIds.length === 0 || 
    !state.selectedObjective;
    
  // Journaliser les changements d'état du bouton
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
