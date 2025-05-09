
import React from "react";
import { Button } from "@/components/ui/button";
import { Wand2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStoryForm } from "@/contexts/story-form/StoryFormContext";

interface EnhancedSubmitButtonProps {
  className?: string;
}

/**
 * Bouton de soumission amélioré avec feedback visuel renforcé
 * et contrôles d'accès au clavier
 */
const EnhancedSubmitButton: React.FC<EnhancedSubmitButtonProps> = ({ className }) => {
  const { state, isGenerateButtonDisabled } = useStoryForm();
  const { isSubmitting } = state;
  
  // Déterminer les raisons de désactivation du bouton
  const getButtonHint = () => {
    if (isSubmitting) {
      return "Génération en cours...";
    }
    
    if (state.selectedChildrenIds.length === 0 && !state.selectedObjective) {
      return "Veuillez sélectionner au moins un enfant et un objectif";
    }
    
    if (state.selectedChildrenIds.length === 0) {
      return "Veuillez sélectionner au moins un enfant";
    }
    
    if (!state.selectedObjective) {
      return "Veuillez sélectionner un objectif";
    }
    
    return "Créer une histoire";
  };
  
  return (
    <Button
      type="submit"
      className={cn(
        "w-full text-white dark:text-white py-6 text-lg relative overflow-hidden group",
        "transition-all duration-300",
        isGenerateButtonDisabled ? "opacity-70" : "hover:scale-[1.02] active:scale-[0.98]",
        className
      )}
      disabled={isGenerateButtonDisabled}
      aria-label={getButtonHint()}
      data-testid="generate-story-button"
    >
      {isSubmitting ? (
        <>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Génération en cours...
        </>
      ) : (
        <>
          <Wand2 className={cn(
            "mr-2 h-5 w-5",
            "transition-transform duration-300 group-hover:rotate-12"
          )} />
          Créer une histoire
          
          {/* Animation de fond subtile */}
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-primary/0 via-primary/30 to-primary/0 opacity-0 group-hover:opacity-100 animate-shimmer"></div>
        </>
      )}
    </Button>
  );
};

export default EnhancedSubmitButton;
