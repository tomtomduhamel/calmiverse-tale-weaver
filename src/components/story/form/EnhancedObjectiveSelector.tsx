
import React from "react";
import { useStoryForm } from "@/contexts/StoryFormContext";
import { cn } from "@/lib/utils";
import type { Objective } from "@/types/story";

interface EnhancedObjectiveSelectorProps {
  objectives: Objective[];
  className?: string;
}

/**
 * Sélecteur d'objectif amélioré avec validation robuste
 * et feedback visuel renforcé
 */
const EnhancedObjectiveSelector: React.FC<EnhancedObjectiveSelectorProps> = ({
  objectives,
  className,
}) => {
  const { state, handleObjectiveSelect, updateDebugInfo } = useStoryForm();
  const { selectedObjective, formError } = state;
  
  // Déterminer si une erreur concerne la sélection d'objectif
  const hasError = formError && 
    (formError.toLowerCase().includes('objectif') || 
     formError.toLowerCase().includes('objective'));
  
  // Gestionnaire de sélection optimisé
  const handleSelectObjective = (objective: string) => {
    console.log("[EnhancedObjectiveSelector] Sélection objectif:", objective);
    
    if (!objective) {
      console.error("[EnhancedObjectiveSelector] Tentative de sélection avec ID vide");
      return;
    }
    
    // Vérifier si l'objectif existe
    const objectiveExists = objectives.some(obj => obj.value === objective);
    if (!objectiveExists) {
      console.error("[EnhancedObjectiveSelector] Tentative de sélection d'un objectif inexistant:", objective);
      return;
    }
    
    // Traçage de l'action
    console.log("[EnhancedObjectiveSelector] Appel de handleObjectiveSelect avec:", objective);
    updateDebugInfo({
      objectiveSelection: {
        selectedValue: objective,
        timestamp: new Date().toISOString()
      }
    });
    
    handleObjectiveSelect(objective);
  };
  
  return (
    <div className={cn("space-y-4", className)}>
      <div className={cn(
        "text-secondary dark:text-white text-lg font-medium",
        hasError ? "text-destructive" : ""
      )}>
        Quel est l'objectif de cette histoire ?
        {hasError && <span className="ml-2 text-sm text-destructive">*</span>}
      </div>
      
      <div 
        className={cn(
          "grid grid-cols-1 sm:grid-cols-2 gap-3",
          hasError ? "border-2 border-destructive/20 p-2 rounded-lg" : ""
        )}
      >
        {objectives.map((objective) => {
          const isSelected = selectedObjective === objective.value;
          
          return (
            <div
              key={objective.id}
              onClick={() => handleSelectObjective(objective.value)}
              className={cn(
                "flex items-center p-4 rounded-lg cursor-pointer transition-all",
                isSelected 
                  ? "bg-primary/10 hover:bg-primary/20 ring-2 ring-primary" 
                  : "hover:bg-muted/50 dark:hover:bg-muted-dark/50 border border-muted",
                "transform transition-transform duration-150",
                isSelected ? "scale-[1.02]" : ""
              )}
              data-testid={`objective-item-${objective.id}`}
              role="radio"
              aria-checked={isSelected}
              tabIndex={0}
            >
              <div className="flex-grow">
                <div className={cn(
                  "font-medium text-base leading-tight",
                  isSelected ? "text-primary font-semibold" : ""
                )}>
                  {objective.label}
                </div>
              </div>
              
              {isSelected && (
                <div className="ml-auto w-5 h-5 rounded-full bg-primary flex items-center justify-center text-white">
                  <svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" strokeWidth="3" fill="none">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EnhancedObjectiveSelector;
