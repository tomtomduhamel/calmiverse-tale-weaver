
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { UserSettings } from "@/types/user-settings";

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
  const handleReadingSpeedChange = async (value: number[]) => {
    await onUpdateSettings({
      readingPreferences: {
        ...userSettings.readingPreferences,
        readingSpeed: value[0]
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
          <div className="flex items-center justify-between">
            <Label htmlFor="reading-speed" className="text-base font-medium">
              Vitesse de lecture
            </Label>
            <span className="text-sm font-medium">
              {userSettings.readingPreferences?.readingSpeed || 125} mots/minute
            </span>
          </div>
          <Slider
            id="reading-speed"
            defaultValue={[userSettings.readingPreferences?.readingSpeed || 125]}
            min={50}
            max={300}
            step={5}
            onValueChange={handleReadingSpeedChange}
            disabled={isLoading}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Lent</span>
            <span>Normal</span>
            <span>Rapide</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
