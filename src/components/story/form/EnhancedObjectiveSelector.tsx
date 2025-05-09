
import React from "react";
import { CheckCircle2 } from "lucide-react";
import { useStoryForm } from "@/contexts/story-form/StoryFormContext";
import { cn } from "@/lib/utils";
import type { Objective } from "@/types/story";

interface EnhancedObjectiveSelectorProps {
  objectives: Objective[];
}

/**
 * Sélecteur d'objectifs amélioré avec états visuels optimisés
 */
const EnhancedObjectiveSelector: React.FC<EnhancedObjectiveSelectorProps> = ({
  objectives,
}) => {
  const { state, handleObjectiveSelect } = useStoryForm();
  const { selectedObjective } = state;

  if (!objectives || objectives.length === 0) {
    return (
      <div className="py-4 text-center">
        <p className="text-muted-foreground">
          Aucun objectif disponible pour le moment.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-medium mb-2">Choisir un objectif</h2>
      <p className="text-muted-foreground text-sm mb-4">
        Sélectionnez l'objectif principal de l'histoire
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {objectives.map((objective) => {
          const isSelected = selectedObjective === objective.value;
          
          return (
            <div
              key={objective.id}
              className={cn(
                "p-4 border rounded-xl cursor-pointer transition-all",
                isSelected
                  ? "bg-primary/10 border-primary/30 shadow-sm"
                  : "hover:bg-muted hover:border-muted-foreground/20"
              )}
              onClick={() => handleObjectiveSelect(objective.value)}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {isSelected ? (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  ) : (
                    <div className="h-5 w-5 border border-muted-foreground/30 rounded-full" />
                  )}
                </div>
                <div>
                  <div className="font-medium">{objective.label}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EnhancedObjectiveSelector;
