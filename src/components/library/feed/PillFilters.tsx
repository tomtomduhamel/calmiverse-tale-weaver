import React, { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { STORY_OBJECTIVES } from "@/utils/objectiveUtils";
import { BookOpen, Book, BookOpenCheck, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PillFiltersProps {
  selectedObjective: string | null;
  onObjectiveChange: (objective: string | null) => void;
  statusFilter?: 'all' | 'pending' | 'ready' | 'read' | 'unread' | 'error' | 'favorites' | 'recent';
  onStatusFilterChange?: (status: 'all' | 'pending' | 'ready' | 'read' | 'unread' | 'error' | 'favorites' | 'recent') => void;
  className?: string;
}

const PillFilters: React.FC<PillFiltersProps> = ({
  selectedObjective,
  onObjectiveChange,
  statusFilter = 'all',
  onStatusFilterChange,
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

        {/* Status Filter Dropdown */}
        {onStatusFilterChange && (
          <div className="flex items-center pl-1 ml-1 border-l border-border/50">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant={(statusFilter === 'read' || statusFilter === 'unread') ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "flex-shrink-0 rounded-full px-3 h-9 text-sm font-medium",
                    (statusFilter === 'read' || statusFilter === 'unread')
                      ? "bg-primary text-primary-foreground shadow-md" 
                      : "bg-card hover:bg-accent border-border"
                  )}
                >
                  {statusFilter === 'read' ? (
                    <><BookOpenCheck className="h-4 w-4 mr-1.5" /> Lues</>
                  ) : statusFilter === 'unread' ? (
                    <><Book className="h-4 w-4 mr-1.5" /> Non lues</>
                  ) : (
                    <><Filter className="h-4 w-4 mr-1.5" /> Statut</>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[180px] z-[100]">
                <DropdownMenuLabel>Filtrer par statut</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => onStatusFilterChange('all')}
                  className={cn("cursor-pointer", statusFilter !== 'read' && statusFilter !== 'unread' && "bg-accent")}
                >
                  <BookOpen className="ml-2 mr-2 h-4 w-4" />
                  <span>Toutes les histoires</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onStatusFilterChange('unread')}
                  className={cn("cursor-pointer", statusFilter === 'unread' && "bg-accent")}
                >
                  <Book className="ml-2 mr-2 h-4 w-4" />
                  <span>Histoires non lues</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onStatusFilterChange('read')}
                  className={cn("cursor-pointer", statusFilter === 'read' && "bg-accent")}
                >
                  <BookOpenCheck className="ml-2 mr-2 h-4 w-4" />
                  <span>Histoires lues</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </div>
  );
};

export default PillFilters;
