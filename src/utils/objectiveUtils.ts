import { Moon, Brain, Heart, Sparkles, Zap } from "lucide-react";
import { ALL_FAST_STORIES } from "@/config/fastStoryConfig";
import type { Story } from "@/types/story";

export interface ObjectiveOption {
  id: string;
  label: string;
  value: string;
  icon: React.ComponentType<any>;
}

export const STORY_OBJECTIVES: ObjectiveOption[] = [
  { id: "sleep", label: "s'endormir", value: "sleep", icon: Moon },
  { id: "focus", label: "se concentrer", value: "focus", icon: Brain },
  { id: "relax", label: "se détendre", value: "relax", icon: Heart }, 
  { id: "fun", label: "s'amuser", value: "fun", icon: Sparkles }
];

/**
 * Objectif interne pour les histoires rapides — utilisé uniquement dans les filtres,
 * jamais affiché dans le sélecteur de création guidée.
 */
export const FAST_STORY_OBJECTIVE: ObjectiveOption = {
  id: "custom", label: "histoires rapides", value: "custom", icon: Zap
};

/**
 * Extract objective value from story.objective field
 * Handles both string and object formats
 */
export const extractObjectiveValue = (objective: any): string | null => {
  if (!objective) return null;
  
  if (typeof objective === 'string') {
    return objective;
  }
  
  if (typeof objective === 'object') {
    return objective.value || objective.name || null;
  }
  
  return null;
};

/**
 * Get objective option by value
 */
export const getObjectiveByValue = (value: string): ObjectiveOption | null => {
  return STORY_OBJECTIVES.find(obj => obj.value === value) || null;
};

/**
 * Get the full identity (label + icon) for a story based on its objective and metadata
 */
export const getStoryIdentity = (story: Story): { label: string; icon: any; iconType: 'lucide' | 'emoji' } | null => {
  if (!story) return null;
  const objective = story.objective;
  const value = extractObjectiveValue(objective);

  // 1. Try to match by prompt key or ID in objective value
  if (value) {
    const standardObj = getObjectiveByValue(value);
    if (standardObj) {
      return {
        label: standardObj.label,
        icon: standardObj.icon,
        iconType: 'lucide'
      };
    }

    const fastStory = ALL_FAST_STORIES.find(item => item.id === value || item.promptKey === value);
    if (fastStory) {
      return {
        label: fastStory.label,
        icon: fastStory.icon,
        iconType: 'emoji'
      };
    }
  }

  // 2. Fallback: Search in settings.theme or story_analysis.themes
  const potentialThemes = [
    story.settings?.theme,
    ...(story.story_analysis?.themes || []),
    story.settings?.atmosphere
  ].filter(t => typeof t === 'string' && t.length > 0) as string[];

  for (const theme of potentialThemes) {
    const matched = ALL_FAST_STORIES.find(item => 
      theme.toLowerCase().includes(item.label.toLowerCase()) ||
      item.label.toLowerCase().includes(theme.toLowerCase())
    );
    if (matched) {
      return {
        label: matched.label,
        icon: matched.icon,
        iconType: 'emoji'
      };
    }
  }

  // 3. Last resort: match by text in title or preview (only if objective is custom/empty)
  if (value === 'custom' || !value) {
    const searchText = `${story.title} ${story.preview} ${story.story_summary}`.toLowerCase();
    const matched = ALL_FAST_STORIES.find(item => 
      searchText.includes(item.label.toLowerCase())
    );
    if (matched) {
      return {
        label: matched.label,
        icon: matched.icon,
        iconType: 'emoji'
      };
    }
    
    if (value === 'custom') {
      return {
        label: "rapide",
        icon: Zap,
        iconType: 'lucide'
      };
    }
  }

  return null;
};