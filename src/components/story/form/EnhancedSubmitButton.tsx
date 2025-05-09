
import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles } from "lucide-react";
import { useStoryForm } from "@/contexts/story-form/StoryFormContext";
import { cn } from "@/lib/utils";

/**
 * Bouton de soumission amélioré avec gestion d'état centralisée
 */
const EnhancedSubmitButton: React.FC = () => {
  const { state, isGenerateButtonDisabled } = useStoryForm();
  const { isSubmitting, selectedChildrenIds, selectedObjective } = state;
  
  // Déterminer l'état exact du bouton pour le débogage
  const noChildrenSelected = selectedChildrenIds.length === 0;
  const noObjectiveSelected = !selectedObjective;
  const isDisabled = isGenerateButtonDisabled;
  
  console.log("[EnhancedSubmitButton] Rendu avec:", {
    isSubmitting,
    noChildrenSelected,
    noObjectiveSelected,
    isDisabled,
    selectedChildrenCount: selectedChildrenIds.length
  });
  
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
