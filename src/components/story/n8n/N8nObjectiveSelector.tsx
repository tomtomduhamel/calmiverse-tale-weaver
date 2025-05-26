
import React from "react";
import { Label } from "@/components/ui/label";
import { useStoryObjectives } from "@/hooks/useStoryObjectives";

interface N8nObjectiveSelectorProps {
  selectedObjective: string;
  onObjectiveSelect: (objective: string) => void;
}

const N8nObjectiveSelector: React.FC<N8nObjectiveSelectorProps> = ({
  selectedObjective,
  onObjectiveSelect
}) => {
  const { objectives } = useStoryObjectives();

  const defaultObjectives = [
    { id: "sleep", label: "Aider à s'endormir", value: "sleep" },
    { id: "focus", label: "Se concentrer", value: "focus" },
    { id: "relax", label: "Se relaxer", value: "relax" },
    { id: "fun", label: "S'amuser", value: "fun" },
  ];

  const objectivesToUse = objectives || defaultObjectives;

  return (
    <div className="space-y-2">
      <Label>Objectif de l'histoire</Label>
      <div className="grid grid-cols-2 gap-2">
        {objectivesToUse.map((objective) => (
          <div
            key={objective.id}
            onClick={() => onObjectiveSelect(objective.value)}
            className={`p-3 rounded-lg border cursor-pointer transition-colors ${
              selectedObjective === objective.value
                ? 'border-blue-500 bg-blue-100 dark:bg-blue-900/50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <span className="text-sm font-medium">{objective.label}</span>
            {selectedObjective === objective.value && (
              <span className="ml-2 text-xs text-blue-600">✓</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default N8nObjectiveSelector;
