
import { useState, useCallback, useMemo } from 'react';
import type { Story, StorySettings, StoryCharacter, StoryLocation } from '@/types/story';

export const useStorySettings = (story: Story | null) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateStorySettings = useCallback(async (settings: StorySettings) => {
    if (!story) return;

    setIsLoading(true);
    setError(null);

    try {
      // Simuler un appel API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Story settings updated:', settings);
      
    } catch (err) {
      setError('Failed to update story settings');
      console.error('Error updating story settings:', err);
    } finally {
      setIsLoading(false);
    }
  }, [story]);

  const calculateWordCount = useCallback(() => {
    if (!story?.content) return 0; // CORRECTION: utiliser 'content' au lieu de 'story_text'
    return story.content.trim().split(/\s+/).length;
  }, [story?.content]);

  // Fonction pour extraire les paramètres depuis une histoire existante
  const extractSettingsFromStory = useCallback((story: Story): StorySettings => {
    if (!story) {
      return {
        characters: [{ name: "", description: "" }],
        locations: [{ name: "", description: "" }],
        atmosphere: "",
        theme: "",
        additionalNotes: ""
      };
    }

    // Analyse basique du contenu pour extraire des informations
    const content = story.content || "";
    
    // Extraire les personnages mentionnés (analyse simple)
    const characterMatches = content.match(/([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)/g) || [];
    const uniqueCharacters = [...new Set(characterMatches)].slice(0, 3);
    
    const characters: StoryCharacter[] = uniqueCharacters.length > 0 
      ? uniqueCharacters.map(name => ({
          name,
          description: `Personnage principal de l'histoire`
        }))
      : [{ name: "", description: "" }];

    // Extraire les lieux (analyse simple)
    const locationKeywords = ['forêt', 'château', 'maison', 'école', 'jardin', 'parc', 'plage', 'montagne'];
    const foundLocations = locationKeywords.filter(keyword => 
      content.toLowerCase().includes(keyword)
    );
    
    const locations: StoryLocation[] = foundLocations.length > 0
      ? foundLocations.slice(0, 2).map(location => ({
          name: location.charAt(0).toUpperCase() + location.slice(1),
          description: `Lieu important de l'histoire`
        }))
      : [{ name: "", description: "" }];

    // Analyser l'ambiance basée sur l'objectif
    let atmosphere = "";
    if (typeof story.objective === 'string') {
      switch (story.objective) {
        case 'sleep':
          atmosphere = "Calme et apaisante";
          break;
        case 'fun':
          atmosphere = "Joyeuse et énergique";
          break;
        case 'focus':
          atmosphere = "Concentrée et engageante";
          break;
        default:
          atmosphere = "Bienveillante et chaleureuse";
      }
    }

    return {
      characters,
      locations,
      atmosphere,
      theme: "Aventure et apprentissage",
      additionalNotes: ""
    };
  }, []);

  return {
    updateStorySettings,
    calculateWordCount,
    extractSettingsFromStory,
    isLoading,
    error
  };
};
