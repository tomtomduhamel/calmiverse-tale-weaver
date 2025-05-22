
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Book, ArrowDown } from 'lucide-react';
import { UserSettings } from '@/types/user-settings';

interface ReadingPreferencesSectionProps {
  readingPreferences: UserSettings['readingPreferences'];
  onPreferenceChange: (key: keyof UserSettings['readingPreferences'], value: any) => Promise<void>;
}

export const ReadingPreferencesSection: React.FC<ReadingPreferencesSectionProps> = ({ 
  readingPreferences, 
  onPreferenceChange 
}) => {
  // État local pour suivre la valeur du slider pendant que l'utilisateur le fait glisser
  const [localReadingSpeed, setLocalReadingSpeed] = useState(readingPreferences.readingSpeed);
  
  // Mettre à jour la valeur locale lorsque les props changent
  useEffect(() => {
    setLocalReadingSpeed(readingPreferences.readingSpeed);
  }, [readingPreferences.readingSpeed]);
  
  // Gestionnaire pour les changements de valeur du slider pendant le glissement
  const handleSliderChange = (value: number[]) => {
    setLocalReadingSpeed(value[0]);
  };
  
  // Gestionnaire pour la fin du glissement - enregistre la valeur finale
  const handleSliderCommit = async () => {
    if (localReadingSpeed !== readingPreferences.readingSpeed) {
      await onPreferenceChange('readingSpeed', localReadingSpeed);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Book className="h-5 w-5" />
          Préférences de lecture
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <label className="text-sm font-medium">Défilement automatique</label>
            <p className="text-sm text-muted-foreground">
              Activer le défilement automatique pendant la lecture
            </p>
          </div>
          <Switch
            checked={readingPreferences.autoScrollEnabled}
            onCheckedChange={(checked) => onPreferenceChange('autoScrollEnabled', checked)}
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Vitesse de lecture</label>
            <span className="text-sm text-muted-foreground">
              {localReadingSpeed} mots par minute
            </span>
          </div>
          <Slider
            value={[localReadingSpeed]}
            min={75}
            max={200}
            step={5}
            disabled={!readingPreferences.autoScrollEnabled}
            onValueChange={handleSliderChange}
            onValueCommit={handleSliderCommit}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Ajustez la vitesse à laquelle le texte défile automatiquement.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
