
import { useCallback, useState } from "react";
import { Story, StorySettings } from "@/types/story";

export const useStorySettings = () => {
  const [isLoading, setIsLoading] = useState(false);

  // Fonction pour extraire les paramètres d'une histoire
  const extractSettingsFromStory = useCallback((story: Story): StorySettings => {
    setIsLoading(true);
    
    try {
      // Par défaut, structure vide
      const defaultSettings: StorySettings = {
        characters: [],
        locations: [],
        atmosphere: "",
        theme: "",
        additionalNotes: ""
      };
      
      // Si l'histoire n'a pas de settings préexistants
      if (!story.settings) {
        // Analyse simple du texte de l'histoire pour extraire des éléments
        const storyText = story.story_text;
        
        // Extraction heuristique des personnages (recherche des noms qui apparaissent souvent)
        const characterRegex = /([A-Z][a-zéèêëïîùûôç]{2,}\s[A-Z][a-zéèêëïîùûôç]{2,}|[A-Z][a-zéèêëïîùûôç]{2,})/g;
        const potentialCharacters = storyText.match(characterRegex) || [];
        
        // Compter les occurrences de chaque nom
        const characterOccurrences = potentialCharacters.reduce((acc: Record<string, number>, name: string) => {
          if (!acc[name]) acc[name] = 0;
          acc[name]++;
          return acc;
        }, {});
        
        // Filtrer pour ne garder que les noms qui apparaissent plusieurs fois (probablement des personnages)
        const characters = Object.entries(characterOccurrences)
          .filter(([_, count]) => count > 2)  // Apparaît au moins 3 fois
          .map(([name]) => name)
          .slice(0, 5);  // Limiter à 5 personnages maximum
        
        // Recherche de lieux potentiels (après "à", "au", "dans", etc.)
        const locationRegex = /(à|au|dans|sur|vers)\s+([A-Z][a-zéèêëïîùûôç]{2,})/g;
        let match;
        const locations = [];
        
        while ((match = locationRegex.exec(storyText)) !== null && locations.length < 3) {
          const location = match[2];
          if (!locations.includes(location)) {
            locations.push(location);
          }
        }
        
        // Détection basique de l'ambiance et du thème
        const atmosphereKeywords = {
          "joyeuse": ["joie", "heureux", "sourire", "rire", "amusant"],
          "triste": ["triste", "larme", "pleurer", "mélancolie", "sombre"],
          "mystérieuse": ["mystère", "étrange", "inconnu", "secret", "ombre"],
          "aventureuse": ["aventure", "découverte", "exploration", "quête", "voyage"],
          "effrayante": ["peur", "terreur", "effroi", "horreur", "cauchemar"]
        };
        
        const themeKeywords = {
          "amitié": ["ami", "amitié", "ensemble", "entraide", "lien"],
          "famille": ["famille", "parent", "enfant", "frère", "sœur"],
          "courage": ["courage", "brave", "héros", "affronter", "surmonter"],
          "apprentissage": ["apprendre", "leçon", "grandir", "comprendre", "découvrir"],
          "aventure": ["aventure", "découverte", "exploration", "quête", "voyage"]
        };
        
        // Détection de l'ambiance
        let detectedAtmosphere = "";
        let maxAtmosphereCount = 0;
        
        Object.entries(atmosphereKeywords).forEach(([atmosphere, keywords]) => {
          let count = 0;
          keywords.forEach(keyword => {
            const regex = new RegExp(keyword, 'gi');
            const matches = storyText.match(regex);
            if (matches) count += matches.length;
          });
          
          if (count > maxAtmosphereCount) {
            maxAtmosphereCount = count;
            detectedAtmosphere = atmosphere;
          }
        });
        
        // Détection du thème
        let detectedTheme = "";
        let maxThemeCount = 0;
        
        Object.entries(themeKeywords).forEach(([theme, keywords]) => {
          let count = 0;
          keywords.forEach(keyword => {
            const regex = new RegExp(keyword, 'gi');
            const matches = storyText.match(regex);
            if (matches) count += matches.length;
          });
          
          if (count > maxThemeCount) {
            maxThemeCount = count;
            detectedTheme = theme;
          }
        });
        
        // Construire les paramètres extraits
        return {
          characters: characters.map(name => ({
            name,
            description: `Un personnage nommé ${name} dans l'histoire.`
          })),
          locations: locations.map(name => ({
            name,
            description: `Un lieu mentionné dans l'histoire.`
          })),
          atmosphere: detectedAtmosphere || "neutre",
          theme: detectedTheme || "général",
          additionalNotes: ""
        };
      }
      
      return story.settings || defaultSettings;
    } catch (error) {
      console.error("Erreur lors de l'extraction des paramètres:", error);
      return {
        characters: [],
        locations: [],
        atmosphere: "",
        theme: "",
        additionalNotes: ""
      };
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  return {
    extractSettingsFromStory,
    isLoading
  };
};
