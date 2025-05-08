
import React from "react";
import { cn } from "@/lib/utils";
import { useStoryForm } from "@/contexts/StoryFormContext";
import type { Objective } from "@/types/story";

interface EnhancedObjectiveSelectorProps {
  objectives: Objective[];
  className?: string;
}

/**
 * Sélecteur d'objectifs amélioré avec des mécanismes de validation 
 * et de retour visuel renforcés
 */
const EnhancedObjectiveSelector: React.FC<EnhancedObjectiveSelectorProps> = ({ 
  objectives,
  className
}) => {
  const { state, handleObjectiveSelect } = useStoryForm();
  const { selectedObjective, formError } = state;
  
  // Déterminer si une erreur concerne l'objectif
  const hasError = formError && 
    (formError.toLowerCase().includes('objectif') || 
     formError.toLowerCase().includes('objective'));
  
  // Journaliser la sélection de l'objectif
  const handleSelect = (objective: string) => {
    console.log("[EnhancedObjectiveSelector] Objectif sélectionné:", objective);
    handleObjectiveSelect(objective);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className={cn(
        "text-secondary dark:text-white text-lg font-medium",
        hasError ? "text-destructive" : ""
      )}>
        Je souhaite créer un moment de lecture qui va...
        {hasError && <span className="ml-2 text-sm text-destructive">*</span>}
      </div>

      <div className={cn(
        "grid grid-cols-1 sm:grid-cols-2 gap-3",
        hasError ? "border-2 border-destructive/20 p-2 rounded-lg" : ""
      )}>
        {objectives.map((objective) => {
          const isSelected = selectedObjective === objective.value;
          
          return (
            <button
              key={objective.id}
              type="button"
              className={cn(
                "text-left p-4 rounded-lg transition-all border",
                isSelected 
                  ? "bg-primary/10 border-primary shadow-sm hover:bg-primary/15 ring-1 ring-primary" 
                  : "border-border hover:bg-muted/50 dark:hover:bg-muted-dark/50",
                "transform transition-transform duration-150",
                isSelected ? "scale-[1.02]" : ""
              )}
              onClick={() => handleSelect(objective.value)}
              data-testid={`objective-${objective.value}`}
              data-selected={isSelected ? "true" : "false"}
              role="option"
              aria-selected={isSelected}
            >
              <div className="flex items-center">
                <div 
                  className={cn(
                    "w-5 h-5 rounded-full border mr-3 flex-shrink-0 flex items-center justify-center",
                    isSelected 
                      ? "bg-primary border-primary text-white" 
                      : "border-gray-300 bg-white"
                  )}
                >
                  {isSelected && (
                    <svg 
                      viewBox="0 0 24 24" 
                      width="16" 
                      height="16" 
                      stroke="currentColor" 
                      strokeWidth="3" 
                      fill="none" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  )}
                </div>
                <span className={cn(
                  "text-base font-medium",
                  isSelected ? "text-primary font-semibold" : ""
                )}>
                  {objective.label}
                </span>
                
                {isSelected && (
                  <div className="ml-auto text-xs font-medium text-primary">
                    ✓ Sélectionné
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default EnhancedObjectiveSelector;
