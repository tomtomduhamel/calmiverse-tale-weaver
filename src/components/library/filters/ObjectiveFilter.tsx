import React from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { STORY_OBJECTIVES } from "@/utils/objectiveUtils";
import { cn } from "@/lib/utils";

interface ObjectiveFilterProps {
  selectedObjective: string | null;
  onObjectiveChange: (objective: string | null) => void;
}

const ObjectiveFilter: React.FC<ObjectiveFilterProps> = ({
  selectedObjective,
  onObjectiveChange,
}) => {
  const handleObjectiveToggle = (value: string) => {
    if (selectedObjective === value) {
      // Désélectionner si déjà sélectionné (afficher toutes les histoires)
      onObjectiveChange(null);
    } else {
      // Sélectionner le nouvel objectif
      onObjectiveChange(value);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-muted-foreground">Objectifs:</span>
      <div className="flex gap-1">
        {STORY_OBJECTIVES.map((objective) => {
          const IconComponent = objective.icon;
          const isSelected = selectedObjective === objective.value;
          
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