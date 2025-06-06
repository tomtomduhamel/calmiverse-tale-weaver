import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useStorySettings } from "@/hooks/story/useStorySettings";
import type { Story, StorySettings } from "@/types/story";
import { Loader2 } from "lucide-react";

interface StorySettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  story: Story;
}

const StorySettingsDialog: React.FC<StorySettingsDialogProps> = ({
  open,
  onOpenChange,
  story
}) => {
  const { updateStorySettings, calculateWordCount, extractSettingsFromStory, isLoading, error } = useStorySettings(story);
  
  // Initialize settings from story
  const [settings, setSettings] = useState<StorySettings>(() => 
    extractSettingsFromStory(story)
  );

  // Update settings when story changes
  useEffect(() => {
    if (story) {
      setSettings(extractSettingsFromStory(story));
    }
  }, [story, extractSettingsFromStory]);

  const handleSettingChange = (key: keyof StorySettings, index?: number) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { value } = e.target;
    setSettings(prevSettings => {
      if (key === 'characters' && index !== undefined) {
        const updatedCharacters = [...prevSettings.characters];
        updatedCharacters[index] = { ...updatedCharacters[index], name: value };
        return { ...prevSettings, characters: updatedCharacters };
      } else if (key === 'locations' && index !== undefined) {
        const updatedLocations = [...prevSettings.locations];
        updatedLocations[index] = { ...updatedLocations[index], name: value };
        return { ...prevSettings, locations: updatedLocations };
      } else {
        return { ...prevSettings, [key]: value };
      }
    });
  };

  const handleSubmit = async () => {
    await updateStorySettings(settings);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Paramètres de l'histoire</DialogTitle>
        </DialogHeader>
        
        {error && (
          <div className="text-red-500">{error}</div>
        )}

        <div className="grid gap-4 py-4">
          <div>
            <Label htmlFor="word-count">Nombre de mots</Label>
            <Input id="word-count" value={calculateWordCount().toString()} readOnly />
          </div>

          <div>
            <Label htmlFor="character-1">Personnage 1</Label>
            <Input
              type="text"
              id="character-1"
              value={settings.characters[0].name}
              onChange={handleSettingChange('characters', 0)}
            />
          </div>

          <div>
            <Label htmlFor="character-2">Personnage 2</Label>
            <Input
              type="text"
              id="character-2"
              value={settings.characters[1]?.name || ''}
              onChange={handleSettingChange('characters', 1)}
            />
          </div>

          <div>
            <Label htmlFor="location-1">Lieu 1</Label>
            <Input
              type="text"
              id="location-1"
              value={settings.locations[0].name}
              onChange={handleSettingChange('locations', 0)}
            />
          </div>

          <div>
            <Label htmlFor="location-2">Lieu 2</Label>
            <Input
              type="text"
              id="location-2"
              value={settings.locations[1]?.name || ''}
              onChange={handleSettingChange('locations', 1)}
            />
          </div>

          <div>
            <Label htmlFor="atmosphere">Ambiance</Label>
            <Textarea
              id="atmosphere"
              value={settings.atmosphere}
              onChange={handleSettingChange('atmosphere')}
            />
          </div>

          <div>
            <Label htmlFor="theme">Thème</Label>
            <Textarea
              id="theme"
              value={settings.theme}
              onChange={handleSettingChange('theme')}
            />
          </div>

          <div>
            <Label htmlFor="additional-notes">Notes additionnelles</Label>
            <Textarea
              id="additional-notes"
              value={settings.additionalNotes}
              onChange={handleSettingChange('additionalNotes')}
            />
          </div>
        </div>
        <Button onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Mise à jour...
            </>
          ) : (
            "Mettre à jour les paramètres"
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default StorySettingsDialog;
