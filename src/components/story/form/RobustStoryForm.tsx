
import React, { useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StoryError } from "./StoryError";
import RobustChildSelector from "./RobustChildSelector";
import EnhancedObjectiveSelector from "./EnhancedObjectiveSelector";
import EnhancedSubmitButton from "./EnhancedSubmitButton";
import AdvancedDebugPanel from "./AdvancedDebugPanel";
import { useStoryForm } from "@/contexts/story-form/StoryFormContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import type { Child } from "@/types/child";
import type { Objective } from "@/types/story";

interface RobustStoryFormProps {
  children: Child[];
  onCreateChildClick: () => void;
  objectives: Objective[];
  className?: string;
}

/**
 * Formulaire d'histoire robuste avec gestion d'état centralisée
 * et mécanismes de validation avancés
 */
const RobustStoryForm: React.FC<RobustStoryFormProps> = ({
  children,
  onCreateChildClick,
  objectives,
  className
}) => {
  const { 
    state, 
    handleFormSubmit, 
    updateDebugInfo,
    validateForm 
  } = useStoryForm();
  
  const { formError, selectedChildrenIds, selectedObjective } = state;
  const isMobile = useIsMobile();
  
  // Journaliser les rendus pour débogage
  useEffect(() => {
    console.log("[RobustStoryForm] Rendu avec", {
      childCount: children.length,
      objectiveCount: objectives.length,
      hasError: !!formError,
      selectedChildrenCount: selectedChildrenIds.length,
      selectedObjective,
    });
    
    updateDebugInfo({
      formComponentRender: new Date().toISOString(),
      availableChildrenCount: children.length,
      availableObjectivesCount: objectives.length,
      selectedChildrenCount: selectedChildrenIds.length,
      hasSelectedObjective: !!selectedObjective
    });
  }, [
    children, 
    objectives, 
    formError, 
    selectedChildrenIds, 
    selectedObjective,
    updateDebugInfo
  ]);
  
  // Force validation for debugging
  const handleForceValidation = () => {
    console.log("[RobustStoryForm] Force validation triggered");
    
    const validationResult = validateForm();
    console.log("[RobustStoryForm] Résultat de la validation forcée:", validationResult);
    
    updateDebugInfo({
      forceValidationTimestamp: new Date().toISOString(),
      validationData: {
        isValid: validationResult.isValid,
        error: validationResult.error,
        childrenSelected: selectedChildrenIds.length > 0,
        objectiveSelected: !!selectedObjective,
        hasFormError: !!formError
      }
    });
  };
  
  // Hauteur calculée pour éviter les problèmes de mise en page
  const scrollAreaHeight = isMobile 
    ? "h-[calc(100vh-250px)]" 
    : "h-[calc(100vh-180px)]";
  
  return (
    <div className={cn("flex flex-col h-full w-full", className)}>
      <ScrollArea className={scrollAreaHeight}>
        <form 
          onSubmit={handleFormSubmit}
          className="space-y-6 animate-fade-in bg-white dark:bg-muted-dark p-4 sm:p-8 rounded-xl shadow-soft-lg transition-all hover:shadow-xl mx-auto max-w-[95%] sm:max-w-4xl mb-20"
          data-testid="story-form"
        >
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-primary">Créer une nouvelle histoire</h1>
            <p className="text-muted-foreground">
              Personnalisez une histoire magique pour un moment de lecture unique
            </p>
          </div>
          
          <AdvancedDebugPanel onForceValidation={handleForceValidation} />
          
          {formError && (
            <StoryError error={formError} className="mb-4 animate-pulse" />
          )}
          
          <RobustChildSelector 
            children={children}
            onCreateChildClick={onCreateChildClick}
          />

          <EnhancedObjectiveSelector objectives={objectives} />
          
          <div className="mt-6">
            <EnhancedSubmitButton />
          </div>
        </form>
      </ScrollArea>
    </div>
  );
};

export default RobustStoryForm;
