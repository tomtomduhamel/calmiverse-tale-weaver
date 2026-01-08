/**
 * Horizontal scrollable pill filters for objectives
 * Autonomous scroll component that extends beyond parent padding
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
      <div 
        className="flex gap-2 overflow-x-auto px-4 pb-2 scrollbar-hide"
        style={{ 
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      >
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
                "flex-shrink-0 rounded-full px-4 h-9 text-sm font-medium whitespace-nowrap",
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
        {/* Spacer large pour permettre de scroller jusqu'au dernier objectif */}
        <div className="flex-shrink-0 w-16" aria-hidden="true" />
      </div>
    </div>
  );
};

export default PillFilters;
