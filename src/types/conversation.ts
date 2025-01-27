export type ConversationStep = 
  | "welcome"
  | "target_audience"
  | "universe"
  | "location"
  | "main_characters"
  | "secondary_characters"
  | "relationships"
  | "confirmation";

export interface StoryDetails {
  targetAudience: string[];
  universe?: string;
  location?: string;
  mainCharacters?: Character[];
  secondaryCharacters?: Character[];
  relationships?: Relationship[];
}

export interface Character {
  name: string;
  description: string;
}

export interface Relationship {
  character1: string;
  character2: string;
  relationship: string;
}