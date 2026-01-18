
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { UserSettings } from "@/types/user-settings";
import { Snail, Turtle, Rabbit, RotateCcw } from "lucide-react";

// Valeurs par défaut des vitesses
const DEFAULT_SPEEDS = {
  slow: 90,
  normal: 120,
  fast: 150,
};

// Limites de vitesse (50-200 mots/min)
const SPEED_LIMITS = {
  min: 50,
  max: 200,
};

interface ReadingPreferencesSectionProps {
  userSettings: UserSettings;
  isLoading: boolean;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => Promise<void>;
}

export const ReadingPreferencesSection: React.FC<ReadingPreferencesSectionProps> = ({
  userSettings,
  isLoading,
  onUpdateSettings
}) => {
  // États locaux pour les champs d'édition
  const [editingSpeeds, setEditingSpeeds] = useState({
    slow: userSettings.readingPreferences?.customSpeedSlow ?? DEFAULT_SPEEDS.slow,
    normal: userSettings.readingPreferences?.customSpeedNormal ?? DEFAULT_SPEEDS.normal,
    fast: userSettings.readingPreferences?.customSpeedFast ?? DEFAULT_SPEEDS.fast,
  });

  // Synchroniser avec les settings quand ils changent
  React.useEffect(() => {
    setEditingSpeeds({
      slow: userSettings.readingPreferences?.customSpeedSlow ?? DEFAULT_SPEEDS.slow,
      normal: userSettings.readingPreferences?.customSpeedNormal ?? DEFAULT_SPEEDS.normal,
      fast: userSettings.readingPreferences?.customSpeedFast ?? DEFAULT_SPEEDS.fast,
    });
  }, [userSettings.readingPreferences?.customSpeedSlow, userSettings.readingPreferences?.customSpeedNormal, userSettings.readingPreferences?.customSpeedFast]);

  // Gérer le changement du défilement automatique
  const handleAutoScrollChange = async (checked: boolean) => {
    await onUpdateSettings({
      readingPreferences: {
        ...userSettings.readingPreferences,
        autoScrollEnabled: checked
      }
    });
  };

  // Gérer le changement de la vitesse de lecture sélectionnée
  const handleReadingSpeedChange = async (speed: number) => {
    await onUpdateSettings({
      readingPreferences: {
        ...userSettings.readingPreferences,
        readingSpeed: speed
      }
    });
  };

  // Gérer le changement de la musique de fond
  const handleBackgroundMusicChange = async (checked: boolean) => {
    await onUpdateSettings({
      readingPreferences: {
        ...userSettings.readingPreferences,
        backgroundMusicEnabled: checked
      }
    });
  };

  // Valider et sauvegarder une vitesse personnalisée
  const handleCustomSpeedChange = async (speedKey: 'slow' | 'normal' | 'fast', value: string) => {
    const numValue = parseInt(value, 10);
    
    // Mise à jour de l'état local
    setEditingSpeeds(prev => ({
      ...prev,
      [speedKey]: value === '' ? '' : numValue || prev[speedKey]
    }));
  };

  // Sauvegarder lors du blur
  const handleCustomSpeedBlur = async (speedKey: 'slow' | 'normal' | 'fast') => {
    let value = editingSpeeds[speedKey];
    
    // Valider les limites
    if (typeof value === 'number') {
      value = Math.max(SPEED_LIMITS.min, Math.min(SPEED_LIMITS.max, value));
    } else {
      value = DEFAULT_SPEEDS[speedKey];
    }

    // Mettre à jour l'état local avec la valeur validée
    setEditingSpeeds(prev => ({ ...prev, [speedKey]: value }));

    // Mapper vers les propriétés de settings
    const settingsKey = speedKey === 'slow' ? 'customSpeedSlow' 
      : speedKey === 'normal' ? 'customSpeedNormal' 
      : 'customSpeedFast';

    await onUpdateSettings({
      readingPreferences: {
        ...userSettings.readingPreferences,
        [settingsKey]: value
      }
    });
  };

  // Réinitialiser aux valeurs par défaut
  const handleResetToDefaults = async () => {
    setEditingSpeeds(DEFAULT_SPEEDS);
    await onUpdateSettings({
      readingPreferences: {
        ...userSettings.readingPreferences,
        customSpeedSlow: DEFAULT_SPEEDS.slow,
        customSpeedNormal: DEFAULT_SPEEDS.normal,
        customSpeedFast: DEFAULT_SPEEDS.fast,
        readingSpeed: DEFAULT_SPEEDS.normal, // Reset à la vitesse normale par défaut
      }
    });
  };

  // Obtenir les vitesses personnalisées pour le sélecteur
  const customSpeedPresets = [
    {
      key: 'slow' as const,
      icon: Snail,
      speed: userSettings.readingPreferences?.customSpeedSlow ?? DEFAULT_SPEEDS.slow,
      label: 'Lent',
      description: 'Escargot'
    },
    {
      key: 'normal' as const,
      icon: Turtle,
      speed: userSettings.readingPreferences?.customSpeedNormal ?? DEFAULT_SPEEDS.normal,
      label: 'Normal',
      description: 'Tortue'
    },
    {
      key: 'fast' as const,
      icon: Rabbit,
      speed: userSettings.readingPreferences?.customSpeedFast ?? DEFAULT_SPEEDS.fast,
      label: 'Rapide',
      description: 'Lapin'
    },
  ];

  const currentSpeed = userSettings.readingPreferences?.readingSpeed ?? DEFAULT_SPEEDS.normal;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Préférences de lecture</CardTitle>
        <CardDescription>
          Configurez vos préférences pour la lecture des histoires
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Option Défilement automatique */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="auto-scroll" className="text-base font-medium">
              Défilement automatique
            </Label>
            <Switch
              id="auto-scroll"
              checked={userSettings.readingPreferences?.autoScrollEnabled || false}
              onCheckedChange={handleAutoScrollChange}
              disabled={isLoading}
            />
          </div>
          <div className="text-sm text-muted-foreground">
            Activer le défilement automatique lors de la lecture des histoires
          </div>
        </div>

        {/* Option Musique de fond */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="background-music" className="text-base font-medium">
              Musique de fond
            </Label>
            <Switch
              id="background-music"
              checked={userSettings.readingPreferences?.backgroundMusicEnabled || false}
              onCheckedChange={handleBackgroundMusicChange}
              disabled={isLoading}
            />
          </div>
          <div className="text-sm text-muted-foreground">
            Activer la musique de fond lors de la lecture des histoires
          </div>
        </div>

        {/* Sélection de la vitesse de lecture */}
        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <Label className="text-base font-medium">
              Vitesse de lecture
            </Label>
            <div className="text-sm text-muted-foreground">
              Sélectionnez votre vitesse de lecture préférée pour le défilement automatique
            </div>
          </div>
          <TooltipProvider delayDuration={300}>
            <div className="flex gap-2 justify-center">
              {customSpeedPresets.map((preset) => {
                const Icon = preset.icon;
                const isActive = currentSpeed === preset.speed;
                
                return (
                  <Tooltip key={preset.key}>
                    <TooltipTrigger asChild>
                      <Button
                        variant={isActive ? 'default' : 'outline'}
                        size="lg"
                        className={`h-14 w-14 transition-all ${
                          isActive 
                            ? 'bg-primary text-primary-foreground' 
                            : 'hover:bg-muted'
                        }`}
                        onClick={() => handleReadingSpeedChange(preset.speed)}
                        disabled={isLoading}
                      >
                        <Icon className="h-6 w-6" />
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
          <div className="text-center text-sm text-muted-foreground">
            Vitesse actuelle : {currentSpeed} mots/minute
          </div>
        </div>

        {/* Configuration des vitesses personnalisées */}
        <div className="space-y-4 pt-4 border-t">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <Label className="text-base font-medium">
                Personnaliser les vitesses
              </Label>
              <div className="text-sm text-muted-foreground">
                Définissez vos propres valeurs pour chaque mode (50-200 mots/min)
              </div>
            </div>
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResetToDefaults}
                    disabled={isLoading}
                    className="gap-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Valeurs initiales
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Réinitialiser aux valeurs par défaut (90, 120, 150)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {/* Escargot */}
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Snail className="h-5 w-5" />
                <span className="text-sm font-medium">Escargot</span>
              </div>
              <div className="relative w-full">
                <Input
                  type="number"
                  min={SPEED_LIMITS.min}
                  max={SPEED_LIMITS.max}
                  value={editingSpeeds.slow}
                  onChange={(e) => handleCustomSpeedChange('slow', e.target.value)}
                  onBlur={() => handleCustomSpeedBlur('slow')}
                  disabled={isLoading}
                  className="text-center pr-12"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  m/m
                </span>
              </div>
            </div>

            {/* Tortue */}
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Turtle className="h-5 w-5" />
                <span className="text-sm font-medium">Tortue</span>
              </div>
              <div className="relative w-full">
                <Input
                  type="number"
                  min={SPEED_LIMITS.min}
                  max={SPEED_LIMITS.max}
                  value={editingSpeeds.normal}
                  onChange={(e) => handleCustomSpeedChange('normal', e.target.value)}
                  onBlur={() => handleCustomSpeedBlur('normal')}
                  disabled={isLoading}
                  className="text-center pr-12"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  m/m
                </span>
              </div>
            </div>

            {/* Lapin */}
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Rabbit className="h-5 w-5" />
                <span className="text-sm font-medium">Lapin</span>
              </div>
              <div className="relative w-full">
                <Input
                  type="number"
                  min={SPEED_LIMITS.min}
                  max={SPEED_LIMITS.max}
                  value={editingSpeeds.fast}
                  onChange={(e) => handleCustomSpeedChange('fast', e.target.value)}
                  onBlur={() => handleCustomSpeedBlur('fast')}
                  disabled={isLoading}
                  className="text-center pr-12"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  m/m
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
