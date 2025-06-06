
import React from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { Objective } from "@/types/story";

interface DirectObjectiveSelectorProps {
  objectives: Objective[];
  selectedObjective: string;
  onObjectiveSelect: (objective: string) => void;
  hasError?: boolean;
  className?: string;
}

/**
 * Sélecteur d'objectifs simplifié avec gestion directe de l'état
 * Pour résoudre les problèmes de synchronisation
 */
const DirectObjectiveSelector: React.FC<DirectObjectiveSelectorProps> = ({
  objectives,
  selectedObjective,
  onObjectiveSelect,
  hasError = false,
  className
}) => {
  // Gestionnaire de sélection direct sans contexte
  const handleObjectiveSelect = (value: string) => {
    console.log("[DirectObjectiveSelector] Sélection objectif:", value);
    onObjectiveSelect(value);
  };

  return (
    <div className={cn("space-y-4", className)} data-testid="objective-selector">
      <div
        className={cn(
          "text-secondary dark:text-white text-lg font-medium",
          hasError ? "text-destructive" : ""
        )}
      >
        Je souhaite créer un moment de lecture qui va...
        {hasError && <span className="ml-2 text-sm text-destructive">*</span>}
      </div>

      <RadioGroup
        value={selectedObjective}
        onValueChange={handleObjectiveSelect}
        className={cn(
          "grid grid-cols-1 sm:grid-cols-2 gap-3",
          hasError ? "border-2 border-destructive/20 p-3 rounded-lg" : ""
        )}
        data-has-error={hasError ? "true" : "false"}
      >
        {objectives.map((objective) => (
          <div
            key={objective.id}
            className={cn(
              "flex items-center space-x-3 p-3 rounded-lg border border-muted hover:bg-muted/30 dark:hover:bg-muted-dark/30 transition-colors cursor-pointer",
              selectedObjective === objective.value
                ? "bg-primary/5 border-primary/30 ring-1 ring-primary/20"
                : "bg-white dark:bg-muted-dark"
            )}
            onClick={() => handleObjectiveSelect(objective.value)}
            data-testid={`objective-item-${objective.id}`}
            data-selected={selectedObjective === objective.value ? "true" : "false"}
          >
            <RadioGroupItem
              value={objective.value}
              id={`objective-${objective.id}`}
              className="data-[state=checked]:border-primary"
            />
            <Label
              htmlFor={`objective-${objective.id}`}
              className={cn(
                "text-base font-medium cursor-pointer",
                selectedObjective === objective.value && "font-semibold text-primary"
              )}
            >
              {objective.label}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
};

export default DirectObjectiveSelector;
