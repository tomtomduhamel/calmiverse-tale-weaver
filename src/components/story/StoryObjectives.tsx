
import React from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Moon, Brain, Heart, Sparkles } from "lucide-react";

interface ObjectiveOption {
  id: string;
  label: string;
  value: string;
  icon?: React.ReactNode;
}

interface StoryObjectivesProps {
  objectives: ObjectiveOption[];
  selectedObjective: string;
  onObjectiveSelect: (value: string) => void;
  hasError?: boolean;
}

const defaultObjectives: ObjectiveOption[] = [
  { id: "sleep", label: "Aider à s'endormir", value: "sleep", icon: <Moon className="h-5 w-5" /> },
  { id: "focus", label: "Se concentrer", value: "focus", icon: <Brain className="h-5 w-5" /> },
  { id: "relax", label: "Se détendre", value: "relax", icon: <Heart className="h-5 w-5" /> }, 
  { id: "fun", label: "S'amuser", value: "fun", icon: <Sparkles className="h-5 w-5" /> }
];

const StoryObjectives: React.FC<StoryObjectivesProps> = ({
  objectives = defaultObjectives,
  selectedObjective,
  onObjectiveSelect,
  hasError = false
}) => {
  return (
    <RadioGroup
      className={cn(
        "grid grid-cols-1 md:grid-cols-2 gap-4",
        hasError ? "border-2 border-destructive/20 p-2 rounded-lg" : ""
      )}
      value={selectedObjective}
      onValueChange={onObjectiveSelect}
    >
      {objectives.map((objective) => (
        <div
          key={objective.id}
          className={cn(
            "relative flex items-center space-x-2 rounded-md border border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground",
            selectedObjective === objective.value && "border-primary bg-muted",
            hasError && "border-destructive/30"
          )}
        >
          <RadioGroupItem
            value={objective.value}
            id={objective.id}
            className="absolute top-4 right-4"
          />
          <div className="flex items-center gap-3">
            {objective.icon || null}
            <Label
              htmlFor={objective.id}
              className="text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              {objective.label}
            </Label>
          </div>
        </div>
      ))}
    </RadioGroup>
  );
};

export default StoryObjectives;
