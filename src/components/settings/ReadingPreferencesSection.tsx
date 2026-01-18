
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
  // État pour savoir quel champ est en cours d'édition
  const [editingKey, setEditingKey] = useState<'slow' | 'normal' | 'fast' | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  // Gérer le changement du défilement automatique
  const handleAutoScrollChange = async (checked: boolean) => {
    await onUpdateSettings({
      readingPreferences: {
        ...userSettings.readingPreferences,
        autoScrollEnabled: checked
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

  // Obtenir les vitesses personnalisées
  const speeds = {
    slow: userSettings.readingPreferences?.customSpeedSlow ?? DEFAULT_SPEEDS.slow,
    normal: userSettings.readingPreferences?.customSpeedNormal ?? DEFAULT_SPEEDS.normal,
    fast: userSettings.readingPreferences?.customSpeedFast ?? DEFAULT_SPEEDS.fast,
  };

  const currentSpeed = userSettings.readingPreferences?.readingSpeed ?? DEFAULT_SPEEDS.normal;

  // Configuration des presets
  const speedPresets = [
    { key: 'slow' as const, icon: Snail, label: 'Escargot' },
    { key: 'normal' as const, icon: Turtle, label: 'Tortue' },
    { key: 'fast' as const, icon: Rabbit, label: 'Lapin' },
  ];

  // Sélectionner une vitesse (clic sur le bouton icône)
  const handleSelectSpeed = async (speedKey: 'slow' | 'normal' | 'fast') => {
    await onUpdateSettings({
      readingPreferences: {
        ...userSettings.readingPreferences,
        readingSpeed: speeds[speedKey]
      }
    });
  };

  // Commencer l'édition d'une vitesse
  const handleStartEdit = (speedKey: 'slow' | 'normal' | 'fast') => {
    setEditingKey(speedKey);
    setEditValue(speeds[speedKey].toString());
  };

  // Annuler l'édition
  const handleCancelEdit = () => {
    setEditingKey(null);
    setEditValue('');
  };

  // Valider et sauvegarder la vitesse
  const handleSaveSpeed = async () => {
    if (!editingKey) return;

    let value = parseInt(editValue, 10);
    
    // Valider les limites
    if (isNaN(value)) {
      value = DEFAULT_SPEEDS[editingKey];
    } else {
      value = Math.max(SPEED_LIMITS.min, Math.min(SPEED_LIMITS.max, value));
    }

    // Mapper vers les propriétés de settings
    const settingsKeyMap = {
      slow: 'customSpeedSlow',
      normal: 'customSpeedNormal',
      fast: 'customSpeedFast',
    } as const;

    await onUpdateSettings({
      readingPreferences: {
        ...userSettings.readingPreferences,
        [settingsKeyMap[editingKey]]: value,
        // Si la vitesse actuelle correspond à l'ancienne valeur, mettre à jour aussi
        ...(currentSpeed === speeds[editingKey] ? { readingSpeed: value } : {})
      }
    });

    setEditingKey(null);
    setEditValue('');
  };

  // Gérer les touches clavier
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveSpeed();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  // Réinitialiser aux valeurs par défaut
  const handleResetToDefaults = async () => {
    await onUpdateSettings({
      readingPreferences: {
        ...userSettings.readingPreferences,
        customSpeedSlow: DEFAULT_SPEEDS.slow,
        customSpeedNormal: DEFAULT_SPEEDS.normal,
        customSpeedFast: DEFAULT_SPEEDS.fast,
        readingSpeed: DEFAULT_SPEEDS.normal,
      }
    });
  };

  // Vérifier si les vitesses sont différentes des valeurs par défaut
  const hasCustomSpeeds = 
    speeds.slow !== DEFAULT_SPEEDS.slow ||
    speeds.normal !== DEFAULT_SPEEDS.normal ||
    speeds.fast !== DEFAULT_SPEEDS.fast;

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

        {/* Sélection de la vitesse de lecture - Design simplifié */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <Label className="text-base font-medium">
                Vitesse de lecture
              </Label>
              <div className="text-sm text-muted-foreground">
                Cliquez sur la vitesse pour la modifier
              </div>
            </div>
            {hasCustomSpeeds && (
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleResetToDefaults}
                      disabled={isLoading}
                      className="h-8 w-8"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Réinitialiser (90, 120, 150)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>

          <div className="flex justify-center gap-4">
            {speedPresets.map((preset) => {
              const Icon = preset.icon;
              const speed = speeds[preset.key];
              const isActive = currentSpeed === speed;
              const isEditing = editingKey === preset.key;
              
              return (
                <div key={preset.key} className="flex flex-col items-center gap-2">
                  {/* Bouton icône */}
                  <Button
                    variant={isActive ? 'default' : 'outline'}
                    size="lg"
                    className={`h-16 w-16 transition-all ${
                      isActive 
                        ? 'bg-primary text-primary-foreground' 
                        : 'hover:bg-muted'
                    }`}
                    onClick={() => handleSelectSpeed(preset.key)}
                    disabled={isLoading || isEditing}
                  >
                    <Icon className="h-7 w-7" />
                  </Button>

                  {/* Vitesse sous l'icône - éditable au clic */}
                  {isEditing ? (
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        min={SPEED_LIMITS.min}
                        max={SPEED_LIMITS.max}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={handleSaveSpeed}
                        onKeyDown={handleKeyDown}
                        autoFocus
                        className="w-16 h-7 text-center text-sm px-1"
                      />
                    </div>
                  ) : (
                    <button
                      onClick={() => handleStartEdit(preset.key)}
                      disabled={isLoading}
                      className={`text-sm font-medium transition-colors hover:text-primary cursor-pointer ${
                        isActive ? 'text-primary' : 'text-muted-foreground'
                      }`}
                    >
                      {speed}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <div className="text-center text-xs text-muted-foreground">
            mots/minute
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
