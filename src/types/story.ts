
export interface Story {
  id: string;
  id_stories?: string;
  title: string;
  preview: string;
  objective: string | { name: string; value: string };
  childrenIds: string[];
  childrenNames?: string[];
  createdAt: Date;
  status: 'pending' | 'ready' | 'read' | 'error' | 'regenerating' | 'completed';
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
  // Champs de notation
  rating?: number;
  rating_comment?: string;

  sound_id?: string | null;
  image_path?: string | null;
  settings?: StorySettings;
  story_analysis?: StoryAnalysis;
  // Nouveaux champs pour les séries/suites
  series_id?: string | null;
  tome_number?: number | null;
  is_series_starter?: boolean;
  previous_story_id?: string | null;
  next_story_id?: string | null;
  series?: StorySeries; // Relation avec la série
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
// Cette valeur doit être cohérente avec READING_SPEED_WPM dans src/utils/readingTime.ts
export const AVERAGE_WPM = 140;

export const estimateWordCountForDuration = (minutes: number): number => {
  const words = Math.round(minutes * AVERAGE_WPM);
  // Clamp to reasonable bounds
  return Math.min(Math.max(words, 400), 3000);
};

// --- Story Series types ---
export interface StorySeries {
  id: string;
  title: string;
  description?: string;
  author_id: string;
  total_tomes: number;
  created_at: Date;
  updated_at: Date;
  is_active: boolean;
  image_path?: string | null;
}

export interface SequelData {
  seriesTitle?: string;
  previousStoryId: string;
  childrenIds: string[];
  childrenNames: string[];
  objective: string;
  duration: StoryDurationMinutes;
  sequelInstructions?: {
    maintainCharacterConsistency?: boolean;
    referenceToEvents?: boolean;
    evolutionOfCharacters?: boolean;
    newChallengesIntroduced?: boolean;
  };
}

// Library display types for series grouping
export interface SeriesGroup {
  id: string;
  type: 'series';
  series: StorySeries;
  stories: Story[];
  totalStories: number;
  readStories: number;
  lastUpdated: string;
  coverImage?: string;
}

export interface StandaloneStory {
  id: string;
  type: 'story';
  story: Story;
}

export type LibraryItem = SeriesGroup | StandaloneStory;
