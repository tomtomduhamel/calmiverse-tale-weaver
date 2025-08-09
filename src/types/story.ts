
export interface Story {
  id: string;
  id_stories?: string;
  title: string;
  preview: string;
  objective: string | { name: string; value: string };
  childrenIds: string[];
  childrenNames?: string[];
  createdAt: Date;
  status: 'pending' | 'ready' | 'read' | 'error' | 'regenerating';
  content: string; // CORRECTION: utiliser 'content' comme dans la BDD
  story_summary: string;
  authorId?: string;
  sharedWith?: string[];
  _version?: number;
  _lastSync?: any;
  _pendingWrites?: boolean;
  sharing?: {
    publicAccess: {
      enabled: boolean;
      token: string;
      expiresAt: Date;
    };
    sharedEmails: {
      email: string;
      sharedAt: Date;
      accessCount: number;
    }[];
    kindleDeliveries: {
      sentAt: Date;
      status: 'pending' | 'sent' | 'failed';
    }[];
  };
  error?: string;
  tags?: string[];
  isFavorite?: boolean;
  updatedAt?: Date;
  sound_id?: string | null;
  image_path?: string | null;
  settings?: StorySettings;
  story_analysis?: StoryAnalysis;
}

export interface Objective {
  id: string;
  label: string;
  value: string;
}

export interface StoryCharacter {
  name: string;
  description: string;
}

export interface StoryLocation {
  name: string;
  description: string;
}

export interface StorySettings {
  characters: StoryCharacter[];
  locations: StoryLocation[];
  atmosphere: string;
  theme: string;
  additionalNotes?: string;
}

export interface StoryAnalysis {
  writingStyle?: string;
  keywords?: string[];
  recurringPhrases?: string[];
  narrativeStructure?: {
    beginning?: string;
    middle?: string;
    end?: string;
  };
  characters?: {
    main?: Array<{
      name: string;
      characteristics: string[];
    }>;
    secondary?: Array<{
      name: string;
      characteristics: string[];
    }>;
  };
  themes?: string[];
}

// --- Story duration types & helpers ---
export type StoryDurationMinutes = 5 | 10 | 15;

export const STORY_DURATION_OPTIONS: readonly StoryDurationMinutes[] = [5, 10, 15] as const;

// Rough reading speed for kids-friendly text (words per minute)
const AVERAGE_WPM = 140;

export const estimateWordCountForDuration = (minutes: number): number => {
  const words = Math.round(minutes * AVERAGE_WPM);
  // Clamp to reasonable bounds
  return Math.min(Math.max(words, 400), 3000);
};
