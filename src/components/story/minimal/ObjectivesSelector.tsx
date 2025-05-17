
import React from "react";
import { AlertCircle } from "lucide-react";
import type { Objective } from "@/types/story";

interface ObjectivesSelectorProps {
  objectives: Objective[];
  selectedObjective: string;
  onObjectiveSelect: (objectiveValue: string) => void;
  error: string | null;
}

const ObjectivesSelector: React.FC<ObjectivesSelectorProps> = ({
  objectives,
  selectedObjective,
  onObjectiveSelect,
  error
}) => {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium">Je souhaite créer un moment de lecture qui va...</h2>
      
      {error && error.includes("objectif") && (
        <div className="bg-destructive/10 border border-destructive p-3 rounded-lg text-destructive mb-3 flex items-center">
          <AlertCircle className="h-4 w-4 mr-2" />
          <span className="text-sm">{error}</span>
        </div>
      )}
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {objectives.map((objective) => (
          <div
            key={objective.id}
            className={`flex items-center space-x-3 p-3 rounded-lg border border-muted hover:bg-muted/30 dark:hover:bg-muted-dark/30 transition-colors cursor-pointer ${
              selectedObjective === objective.value
                ? "bg-primary/5 border-primary/30 ring-1 ring-primary/20"
                : "bg-white dark:bg-gray-800"
            }`}
            onClick={() => onObjectiveSelect(objective.value)}
          >
            <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
              selectedObjective === objective.value
                ? "border-primary bg-primary"
                : "border-gray-300 dark:border-gray-600"
            }`}>
              {selectedObjective === objective.value && (
                <div className="w-2 h-2 rounded-full bg-white"></div>
              )}
            </div>
            <div
              className={`text-base font-medium cursor-pointer ${
                selectedObjective === objective.value && "font-semibold text-primary"
              }`}
            >
              {objective.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ObjectivesSelector;
