import React from 'react';
import { Button } from '@/components/ui/button';
import { Snail, Turtle, Rabbit } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useUserSettings } from '@/hooks/settings/useUserSettings';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/integrations/supabase/client';

interface ReadingSpeedSelectorProps {
  isDarkMode?: boolean;
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

export const ReadingSpeedSelector: React.FC<ReadingSpeedSelectorProps> = ({ isDarkMode = false }) => {
  const { userSettings } = useUserSettings();
  const { user } = useSupabaseAuth();
  const currentSpeed = userSettings?.readingPreferences?.readingSpeed || 125;

  const handleSpeedChange = async (newSpeed: number) => {
    if (!user) return;
    
    try {
      // Mise à jour silencieuse sans notification toast
      const { error } = await supabase
        .from('users')
        .update({ reading_speed: newSpeed })
        .eq('id', user.id);
      
      if (error) {
        console.error('[ReadingSpeed] Erreur lors du changement de vitesse:', error);
      } else {
        console.log(`[ReadingSpeed] Vitesse changée: ${newSpeed} mots/min`);
      }
    } catch (error) {
      console.error('[ReadingSpeed] Erreur lors du changement de vitesse:', error);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
        Vitesse
      </span>
      <TooltipProvider delayDuration={300}>
        <div className="flex gap-1">
          {SPEED_PRESETS.map((preset) => {
            const Icon = preset.icon;
            const isActive = currentSpeed === preset.speed;
            
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
