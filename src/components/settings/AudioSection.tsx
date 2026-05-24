
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Headphones, Globe, Sparkles, Lock, CheckCircle2 } from 'lucide-react';
import { UserSettings } from '@/types/user-settings';
import { useSubscription } from '@/hooks/subscription/useSubscription';
import { cn } from '@/lib/utils';

interface AudioSectionProps {
  userSettings: UserSettings;
  isLoading: boolean;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => Promise<void>;
}

export const AudioSection: React.FC<AudioSectionProps> = ({
  userSettings,
  isLoading,
  onUpdateSettings,
}) => {
  const { limits } = useSubscription();
  const canUsePremiumAudio = (limits?.audio_generations_per_month ?? 0) > 0;

  const currentMode = userSettings.readingPreferences?.audioMode ?? 'browser';

  const handleSelectMode = async (mode: 'browser' | 'premium') => {
    if (mode === 'premium' && !canUsePremiumAudio) return;
    if (isLoading) return;

    await onUpdateSettings({
      readingPreferences: {
        ...userSettings.readingPreferences,
        audioMode: mode,
      },
    });
  };

  const options: Array<{
    id: 'browser' | 'premium';
    icon: React.ReactNode;
    label: string;
    description: string;
    badge?: string;
    locked?: boolean;
  }> = [
    {
      id: 'browser',
      icon: <Globe className="h-5 w-5" />,
      label: 'Audio navigateur',
      description: 'Lecture via la synthèse vocale intégrée à votre navigateur. Gratuit, sans limite.',
    },
    {
      id: 'premium',
      icon: <Sparkles className="h-5 w-5" />,
      label: 'Audio premium',
      description: 'Voix haute qualité générée par IA, disponible à tout moment.',
      badge: 'Calmix',
      locked: !canUsePremiumAudio,
    },
  ];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Headphones className="h-5 w-5 text-primary" />
          Audio
        </CardTitle>
        <CardDescription>
          Choisissez le mode de lecture audio pour vos histoires
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <TooltipProvider delayDuration={0}>
          {options.map((option) => {
            const isSelected = currentMode === option.id;
            const isDisabled = option.locked || isLoading;

            const card = (
              <button
                key={option.id}
                type="button"
                disabled={isDisabled}
                onClick={() => handleSelectMode(option.id)}
                className={cn(
                  'w-full text-left rounded-lg border-2 p-4 transition-all',
                  'flex items-start gap-3',
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-background hover:border-primary/50 hover:bg-muted/40',
                  isDisabled && 'opacity-50 cursor-not-allowed hover:border-border hover:bg-background'
                )}
              >
                {/* Icône */}
                <div
                  className={cn(
                    'shrink-0 mt-0.5 rounded-md p-1.5',
                    isSelected ? 'text-primary bg-primary/10' : 'text-muted-foreground bg-muted'
                  )}
                >
                  {option.icon}
                </div>

                {/* Texte */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Label
                      className={cn(
                        'text-sm font-medium cursor-pointer',
                        isDisabled && 'cursor-not-allowed'
                      )}
                    >
                      {option.label}
                    </Label>

                    {option.badge && (
                      <Badge
                        variant="secondary"
                        className="text-xs px-1.5 py-0"
                      >
                        {option.badge}
                      </Badge>
                    )}

                    {option.locked && (
                      <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    {option.description}
                  </p>
                  {option.locked && (
                    <p className="text-xs text-primary font-medium mt-1">
                      Disponible avec le plan Calmix
                    </p>
                  )}
                </div>

                {/* Indicateur de sélection */}
                <div className="shrink-0 mt-0.5">
                  {isSelected ? (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />
                  )}
                </div>
              </button>
            );

            if (option.locked) {
              return (
                <Tooltip key={option.id}>
                  <TooltipTrigger asChild>
                    <div>{card}</div>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>Disponible à partir du plan Calmix</p>
                  </TooltipContent>
                </Tooltip>
              );
            }

            return card;
          })}
        </TooltipProvider>
      </CardContent>
    </Card>
  );
};
