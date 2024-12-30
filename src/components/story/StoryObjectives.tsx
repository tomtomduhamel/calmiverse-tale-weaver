import React from "react";
import { Button } from "@/components/ui/button";
import { Moon, Brain, Heart, Star } from "lucide-react";
import type { Objective } from "@/types/story";

interface StoryObjectivesProps {
  objectives: Objective[];
  selectedObjective: string;
  onObjectiveSelect: (objective: string) => void;
}

const StoryObjectives: React.FC<StoryObjectivesProps> = ({
  objectives,
  selectedObjective,
  onObjectiveSelect,
}) => {
  const getObjectiveIcon = (value: string) => {
    switch (value) {
      case "sleep":
        return <Moon className="w-5 h-5 shrink-0" />;
      case "focus":
        return <Brain className="w-5 h-5 shrink-0" />;
      case "relax":
        return <Heart className="w-5 h-5 shrink-0" />;
      default:
        return <Star className="w-5 h-5 shrink-0" />;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {objectives.map((objective) => (
        <Button
          key={objective.id}
          type="button"
          variant={selectedObjective === objective.value ? "default" : "outline"}
          onClick={() => onObjectiveSelect(objective.value)}
          className={`flex items-center justify-start gap-3 p-4 h-auto text-left min-h-[64px] ${
            selectedObjective === objective.value
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "hover:bg-muted/50 dark:hover:bg-muted-dark/50"
          }`}
        >
          {getObjectiveIcon(objective.value)}
          <span className="flex-1">{objective.label}</span>
        </Button>
      ))}
    </div>
  );
};

export default StoryObjectives;