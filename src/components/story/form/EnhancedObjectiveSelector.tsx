
import React, { useEffect } from "react";
import { useStoryForm } from "@/contexts/story-form/StoryFormContext";
import { cn } from "@/lib/utils";
import type { Objective } from "@/types/story";

interface EnhancedObjectiveSelectorProps {
  objectives: Objective[];
}

/**
 * Sélecteur d'objectifs amélioré avec gestion d'état centralisée
 */
const EnhancedObjectiveSelector: React.FC<EnhancedObjectiveSelectorProps> = ({ 
  objectives 
}) => {
  const { state, handleObjectiveSelect, updateDebugInfo } = useStoryForm();
  const { selectedObjective, formError } = state;
  
  // Déterminer si l'erreur concerne la sélection d'objectif
  const hasObjectiveError = formError && 
    (formError.toLowerCase().includes('objectif') || formError.toLowerCase().includes('objective'));
  
  // Journaliser les rendus pour débogage
  useEffect(() => {
    console.log("[EnhancedObjectiveSelector] Rendu avec:", {
      objectifsDisponibles: objectives.length,
      objectifSelectionne: selectedObjective,
      erreurObjectif: hasObjectiveError,
      erreur: formError
    });
    
    updateDebugInfo({
      objectiveSelectorRendered: new Date().toISOString(),
      availableObjectives: objectives.length,
      selectedObjective,
      objectiveError: hasObjectiveError ? formError : null
    });
  }, [objectives, selectedObjective, formError, hasObjectiveError, updateDebugInfo]);
  
  // Gestionnaire de sélection d'objectif avec logs
  const handleObjectiveClick = (objectiveId: string) => {
    console.log("[EnhancedObjectiveSelector] Clic sur l'objectif:", objectiveId);
    handleObjectiveSelect(objectiveId);
  };
  
  return (
    <div className={cn(
      "space-y-4",
      hasObjectiveError ? "p-3 border border-destructive/50 rounded-lg bg-destructive/5" : ""
    )}>
      <div className={cn(
        "flex justify-between items-center",
        hasObjectiveError ? "text-destructive" : ""
      )}>
        <h2 className="text-lg font-medium">
          Je souhaite créer un moment de lecture qui va...
        </h2>
        {hasObjectiveError && (
          <p className="text-sm text-destructive font-medium">
            Sélection requise
          </p>
        )}
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {objectives.map((objective) => {
          const isSelected = selectedObjective === objective.value;
          
          return (
            <div
              key={objective.id}
              onClick={() => handleObjectiveClick(objective.value)}
              className={cn(
                "p-4 border rounded-lg cursor-pointer transition-all text-center",
                isSelected 
                  ? "bg-primary/10 border-primary/30 ring-2 ring-primary/20" 
                  : hasObjectiveError
                    ? "border-destructive/30 hover:border-destructive hover:bg-destructive/10"
                    : "hover:bg-muted hover:border-primary/20"
              )}
              data-testid={`objective-${objective.id}`}
            >
              <div className="font-medium">{objective.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EnhancedObjectiveSelector;
