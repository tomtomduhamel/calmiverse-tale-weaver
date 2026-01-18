import React from 'react';
import { Button } from '@/components/ui/button';
import { Snail, Turtle, Rabbit } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useReadingSpeed } from '@/contexts/ReadingSpeedContext';
import { useUserSettings } from '@/hooks/settings/useUserSettings';

interface ReadingSpeedSelectorProps {
  isDarkMode?: boolean;
  compact?: boolean;
}

// Valeurs par défaut des vitesses (utilisées si non personnalisées)
export const DEFAULT_SPEED_PRESETS = {
  slow: 90,
  normal: 120,
  fast: 150,
};

export const ReadingSpeedSelector: React.FC<ReadingSpeedSelectorProps> = ({ isDarkMode = false, compact = false }) => {
  const { readingSpeed, setReadingSpeed } = useReadingSpeed();
  const { userSettings } = useUserSettings();

  // Obtenir les vitesses personnalisées de l'utilisateur ou les valeurs par défaut
  const speedPresets = [
    { 
      key: 'slow',
      icon: Snail, 
      speed: userSettings?.readingPreferences?.customSpeedSlow ?? DEFAULT_SPEED_PRESETS.slow,
      label: 'Lent',
      description: 'Escargot'
    },
    { 
      key: 'normal',
      icon: Turtle, 
      speed: userSettings?.readingPreferences?.customSpeedNormal ?? DEFAULT_SPEED_PRESETS.normal,
      label: 'Normal',
      description: 'Tortue'
    },
    { 
      key: 'fast',
      icon: Rabbit, 
      speed: userSettings?.readingPreferences?.customSpeedFast ?? DEFAULT_SPEED_PRESETS.fast,
      label: 'Rapide',
      description: 'Lapin'
    },
  ];

  const handleSpeedChange = (newSpeed: number) => {
    setReadingSpeed(newSpeed);
  };

  // Déterminer quel preset est actif (correspondance exacte ou le plus proche)
  const getActivePreset = () => {
    const exactMatch = speedPresets.find(p => p.speed === readingSpeed);
    if (exactMatch) return exactMatch.key;
    
    // Si pas de correspondance exacte, trouver le plus proche
    let closest = speedPresets[0];
    let minDiff = Math.abs(speedPresets[0].speed - readingSpeed);
    
    for (const preset of speedPresets) {
      const diff = Math.abs(preset.speed - readingSpeed);
      if (diff < minDiff) {
        minDiff = diff;
        closest = preset;
      }
    }
    return closest.key;
  };

  const activeKey = getActivePreset();

  return (
    <div className="flex items-center gap-2">
      {!compact && (
        <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
          Vitesse
        </span>
      )}
      <TooltipProvider delayDuration={300}>
        <div className="flex gap-1">
          {speedPresets.map((preset) => {
            const Icon = preset.icon;
            const isActive = activeKey === preset.key;
            
            return (
              <Tooltip key={preset.key}>
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
                    <p className="text-xs text-muted-foreground">{preset.speed} mots/min</p>
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
