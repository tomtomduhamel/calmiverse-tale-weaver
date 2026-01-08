/**
 * Horizontal scrollable pill filters for objectives
 * Uses viewport-width calculation to break out of parent padding
 */

import React, { useRef, useEffect } from "react";
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
  const scrollRef = useRef<HTMLDivElement>(null);

  const allOptions = [
    { id: 'all', label: 'Tout', value: null, icon: BookOpen },
    ...STORY_OBJECTIVES.map(obj => ({
      id: obj.id,
      label: obj.label.split(' ').slice(-1)[0],
      value: obj.value,
      icon: obj.icon,
    }))
  ];

  // Scroll active filter into view on mount
  useEffect(() => {
    if (scrollRef.current && selectedObjective) {
      const activeButton = scrollRef.current.querySelector('[data-active="true"]');
      if (activeButton) {
        activeButton.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, []);

  return (
    <div className={cn("w-full", className)}>
      {/* 
        Scroll container with full viewport width calculation
        Uses calc to break out of parent padding on both sides
      */}
      <div 
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide"
        style={{ 
          // Calculate full viewport width minus scrollbar
          width: '100vw',
          // Position to start from left edge of viewport
          marginLeft: 'calc(-50vw + 50%)',
          // Add internal padding for content
          paddingLeft: 'max(1rem, calc(50vw - 50% + 0.25rem))',
          paddingRight: 'max(1rem, calc(50vw - 50% + 0.25rem))',
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
              data-active={isActive}
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
      </div>
    </div>
  );
};

export default PillFilters;
