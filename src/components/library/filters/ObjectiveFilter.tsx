import React from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { STORY_OBJECTIVES } from "@/utils/objectiveUtils";
import { cn } from "@/lib/utils";

interface ObjectiveFilterProps {
  selectedObjectives: string[];
  onObjectiveChange: (objectives: string[]) => void;
}

const ObjectiveFilter: React.FC<ObjectiveFilterProps> = ({
  selectedObjectives,
  onObjectiveChange,
}) => {
  const handleObjectiveToggle = (value: string) => {
    const isSelected = selectedObjectives.includes(value);
    if (isSelected) {
      onObjectiveChange(selectedObjectives.filter(obj => obj !== value));
    } else {
      onObjectiveChange([...selectedObjectives, value]);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-muted-foreground">Objectifs:</span>
      <div className="flex gap-1">
        {STORY_OBJECTIVES.map((objective) => {
          const IconComponent = objective.icon;
          const isSelected = selectedObjectives.includes(objective.value);
          
          return (
            <TooltipProvider key={objective.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleObjectiveToggle(objective.value)}
                    className={cn(
                      "h-9 w-9 p-0",
                      isSelected 
                        ? "bg-primary text-primary-foreground" 
                        : "hover:bg-muted"
                    )}
                  >
                    <IconComponent className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{objective.label}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>
    </div>
  );
};

export default ObjectiveFilter;