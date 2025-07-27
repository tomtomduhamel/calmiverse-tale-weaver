import { Moon, Brain, Heart, Sparkles } from "lucide-react";

export interface ObjectiveOption {
  id: string;
  label: string;
  value: string;
  icon: React.ComponentType<any>;
}

export const STORY_OBJECTIVES: ObjectiveOption[] = [
  { id: "sleep", label: "Aider à s'endormir", value: "sleep", icon: Moon },
  { id: "focus", label: "Se concentrer", value: "focus", icon: Brain },
  { id: "relax", label: "Se détendre", value: "relax", icon: Heart }, 
  { id: "fun", label: "S'amuser", value: "fun", icon: Sparkles }
];

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