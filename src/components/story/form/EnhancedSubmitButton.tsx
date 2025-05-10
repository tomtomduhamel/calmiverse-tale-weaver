
import React, { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles } from "lucide-react";
import { useStoryForm } from "@/contexts/story-form/StoryFormContext";
import { cn } from "@/lib/utils";
import { useNotificationCenter } from "@/hooks/useNotificationCenter";

/**
 * Bouton de soumission amélioré avec gestion d'état centralisée et système de notification
 */
const EnhancedSubmitButton: React.FC = () => {
  const { state, isGenerateButtonDisabled, validateForm } = useStoryForm();
  const { notifyWarning } = useNotificationCenter();
  const { isSubmitting, selectedChildrenIds, selectedObjective, formError } = state;
  
  // Référence pour suivre les rendus
  const renderCountRef = useRef(0);
  const lastStateRef = useRef({ 
    isSubmitting, 
    childrenCount: selectedChildrenIds.length, 
    hasObjective: !!selectedObjective 
  });
  
  // Déterminer l'état exact du bouton pour le débogage
  const noChildrenSelected = selectedChildrenIds.length === 0;
  const noObjectiveSelected = !selectedObjective;
  const isDisabled = isGenerateButtonDisabled;
  
  // Vérifier l'état au montage et à chaque changement significatif
  useEffect(() => {
    renderCountRef.current++;
    
    // Vérifier les changements d'état
    const currentState = { 
      isSubmitting, 
      childrenCount: selectedChildrenIds.length, 
      hasObjective: !!selectedObjective 
    };
    
    const stateChanged = 
      currentState.isSubmitting !== lastStateRef.current.isSubmitting ||
      currentState.childrenCount !== lastStateRef.current.childrenCount ||
      currentState.hasObjective !== lastStateRef.current.hasObjective;
    
    console.log("[EnhancedSubmitButton] Rendu #", renderCountRef.current, {
      isSubmitting,
      noChildrenSelected,
      noObjectiveSelected,
      isDisabled,
      selectedChildrenCount: selectedChildrenIds.length,
      selectedChildrenIds: selectedChildrenIds,
      hasError: !!formError,
      error: formError,
      stateChanged,
      timestamp: new Date().toISOString()
    });
    
    // Mettre à jour la référence d'état
    lastStateRef.current = currentState;
    
    // Si le bouton devient actif, on log le changement
    if (!isDisabled && lastStateRef.current.isDisabled) {
      console.log("[EnhancedSubmitButton] Le bouton est devenu ACTIF", {
        selectedChildrenIds,
        objective: selectedObjective
      });
    }
    
    // Si le bouton devient inactif, on log le changement
    if (isDisabled && !lastStateRef.current.isDisabled) {
      console.log("[EnhancedSubmitButton] Le bouton est devenu INACTIF", {
        raison: noChildrenSelected ? "pas d'enfants sélectionnés" : 
               noObjectiveSelected ? "pas d'objectif sélectionné" : 
               "soumission en cours"
      });
    }
    
    // Mettre à jour la référence d'état du bouton
    lastStateRef.current.isDisabled = isDisabled;
  }, [isSubmitting, noChildrenSelected, noObjectiveSelected, isDisabled, selectedChildrenIds, formError, selectedObjective]);
  
  // Tester la validation à chaque rendu du bouton pour le débogage
  useEffect(() => {
    const validation = validateForm();
    console.log("[EnhancedSubmitButton] Test de validation:", {
      isValid: validation.isValid,
      error: validation.error,
      selectedChildrenIds: selectedChildrenIds,
      timestamp: new Date().toISOString()
    });
  }, [validateForm, selectedChildrenIds]);
  
  const handleClick = () => {
    console.log("[EnhancedSubmitButton] Bouton cliqué avec état:", {
      isDisabled,
      noChildrenSelected,
      noObjectiveSelected,
      selectedChildrenIds: selectedChildrenIds,
      timestamp: new Date().toISOString()
    });
    
    // Afficher une alerte si le bouton est cliqué alors qu'il devrait être désactivé
    // Cela permet de déboguer les problèmes où l'état du bouton n'est pas correctement mis à jour
    if (noChildrenSelected) {
      notifyWarning(
        "Sélection requise", 
        "Veuillez sélectionner au moins un enfant pour générer une histoire."
      );
    } else if (noObjectiveSelected) {
      notifyWarning(
        "Objectif requis", 
        "Veuillez sélectionner un objectif pour l'histoire."
      );
    }
  };
  
  return (
    <Button
      type="submit"
      className={cn(
        "w-full sm:w-auto sm:px-8 relative overflow-hidden transition-all",
        isDisabled ? "opacity-70" : "opacity-100"
      )}
      size="lg"
      disabled={isDisabled}
      data-testid="generate-story-button"
      data-children-selected={selectedChildrenIds.length > 0 ? "true" : "false"}
      data-objective-selected={selectedObjective ? "true" : "false"}
      data-is-submitting={isSubmitting ? "true" : "false"}
      onClick={handleClick}
    >
      {isSubmitting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Création en cours...
        </>
      ) : (
        <>
          <Sparkles className="mr-2 h-4 w-4" />
          Générer une histoire
        </>
      )}
    </Button>
  );
};

export default EnhancedSubmitButton;
