/**
 * Horizontal scrollable pill filters for objectives
 * Uses full-width escape technique for reliable horizontal scroll
 */

import React from "react";
import { Button } from "@/components/ui/button";
import { STORY_OBJECTIVES } from "@/utils/objectiveUtils";
import { BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface PillFiltersProps {
  selectedObjective: string | null;
  onObjectiveChange: (objective: string | null) => void;
  className?: string;
}

const PillFilters: React.FC<PillFiltersProps> = ({
  selectedObjective,
  onObjectiveChange,
  className,
}) => {
  const allOptions = [
    { id: 'all', label: 'Tout', value: null, icon: BookOpen },
    ...STORY_OBJECTIVES.map(obj => ({
      id: obj.id,
      label: obj.label.split(' ').slice(-1)[0],
      value: obj.value,
      icon: obj.icon,
    }))
  ];

  return (
    <div className={cn("w-full", className)}>
      {/* Scrollable container with negative margins to extend to edges */}
      <div 
        className="overflow-x-auto scrollbar-hide -mx-4 px-4"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div className="flex gap-2 pb-2 min-w-max">
          {allOptions.map((option) => {
            const Icon = option.icon;
            const isActive = option.value === selectedObjective;
            
            return (
              <Button
                key={option.id}
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => onObjectiveChange(option.value)}
                className={cn(
                  "flex-none rounded-full px-4 h-9 text-sm font-medium transition-all whitespace-nowrap",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-md" 
                    : "bg-card hover:bg-accent border-border"
                )}
              >
                <Icon className="h-4 w-4 mr-1.5" />
                {option.label}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PillFilters;
