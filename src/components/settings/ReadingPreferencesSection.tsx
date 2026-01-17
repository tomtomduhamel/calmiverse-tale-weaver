
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { UserSettings } from "@/types/user-settings";
import { SPEED_PRESETS } from "@/components/story/reader/controls/ReadingSpeedSelector";

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
  // Gérer le changement du défilement automatique
  const handleAutoScrollChange = async (checked: boolean) => {
    await onUpdateSettings({
      readingPreferences: {
        ...userSettings.readingPreferences,
        autoScrollEnabled: checked
      }
    });
  };

  // Gérer le changement de la vitesse de lecture
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

        {/* Contrôle de la vitesse de lecture */}
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
              {SPEED_PRESETS.map((preset) => {
                const Icon = preset.icon;
                const currentSpeed = userSettings.readingPreferences?.readingSpeed || 120;
                const isActive = currentSpeed === preset.speed;
                
                return (
                  <Tooltip key={preset.speed}>
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
                        <p className="text-xs text-muted-foreground">{preset.description}</p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </TooltipProvider>
          <div className="text-center text-sm text-muted-foreground">
            Vitesse actuelle : {userSettings.readingPreferences?.readingSpeed || 120} mots/minute
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
