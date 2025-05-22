
import React from 'react';
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
              {readingPreferences.readingSpeed} mots par minute
            </span>
          </div>
          <Slider
            value={[readingPreferences.readingSpeed]}
            min={75}
            max={200}
            step={5}
            disabled={!readingPreferences.autoScrollEnabled}
            onValueChange={(value) => onPreferenceChange('readingSpeed', value[0])}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Ajustez la vitesse à laquelle le texte défile automatiquement.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
