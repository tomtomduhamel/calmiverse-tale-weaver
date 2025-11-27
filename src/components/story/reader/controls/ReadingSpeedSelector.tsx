import React from 'react';
import { Button } from '@/components/ui/button';
import { Snail, Turtle, Rabbit } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useReadingSpeed } from '@/contexts/ReadingSpeedContext';

interface ReadingSpeedSelectorProps {
  isDarkMode?: boolean;
  compact?: boolean;
}

const SPEED_PRESETS = [
  { 
    icon: Snail, 
    speed: 75, 
    label: 'Très lent',
    description: '75 mots/min - Lecture très expressive'
  },
  { 
    icon: Turtle, 
    speed: 125, 
    label: 'Normal',
    description: '125 mots/min - Lecture confortable'
  },
  { 
    icon: Rabbit, 
    speed: 200, 
    label: 'Rapide',
    description: '200 mots/min - Lecture fluide'
  },
];

export const ReadingSpeedSelector: React.FC<ReadingSpeedSelectorProps> = ({ isDarkMode = false, compact = false }) => {
  const { readingSpeed, setReadingSpeed } = useReadingSpeed();

  const handleSpeedChange = (newSpeed: number) => {
    setReadingSpeed(newSpeed);
  };

  return (
    <div className="flex items-center gap-2">
      {!compact && (
        <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
          Vitesse
        </span>
      )}
      <TooltipProvider delayDuration={300}>
        <div className="flex gap-1">
          {SPEED_PRESETS.map((preset) => {
            const Icon = preset.icon;
            const isActive = readingSpeed === preset.speed;
            
            return (
              <Tooltip key={preset.speed}>
                <TooltipTrigger asChild>
                  <Button
                    variant={isActive ? 'default' : 'outline'}
                    size="icon"
                    className={`h-9 w-9 transition-all ${
                      isActive 
                        ? 'bg-primary text-primary-foreground' 
                        : 'hover:bg-muted'
                    }`}
                    onClick={() => handleSpeedChange(preset.speed)}
                  >
                    <Icon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-center">
                    <p className="font-medium">{preset.label}</p>
                    <p className="text-xs text-muted-foreground">{preset.description}</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>
    </div>
  );
};
