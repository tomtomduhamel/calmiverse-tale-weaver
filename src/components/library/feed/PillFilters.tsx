/**
 * Horizontal scrollable pill filters for objectives
 * Instagram-style sticky filter bar
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
      label: obj.label.split(' ').slice(-1)[0], // "S'endormir", "Concentrer", etc.
      value: obj.value,
      icon: obj.icon,
    }))
  ];

  return (
    <div className={cn("relative", className)}>
      {/* Scrollable container */}
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 pb-2 pr-8">
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
                  "flex-shrink-0 rounded-full px-3 h-8 text-xs font-medium transition-all whitespace-nowrap",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-md" 
                    : "bg-card hover:bg-accent border-border"
                )}
              >
                <Icon className="h-3.5 w-3.5 mr-1" />
                {option.label}
              </Button>
            );
          })}
        </div>
      </div>
      {/* Scroll indicator gradient */}
      <div className="absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none" />
    </div>
  );
};

export default PillFilters;
