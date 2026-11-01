
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
  video_path?: string | null;
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
  generateVideo?: boolean;
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
export type StoryDurationMinutes = 3 | 5 | 10 | 15;

export const STORY_DURATION_OPTIONS: readonly StoryDurationMinutes[] = [3, 5, 10, 15] as const;

export interface StoryDurationOption {
  minutes: StoryDurationMinutes;
  label: string;
  sublabel: string;
  badge: string;
  shortDescription: string;
  description: string;
}

export const STORY_DURATION_CONFIG: Record<StoryDurationMinutes, StoryDurationOption> = {
  3: {
    minutes: 3,
    label: 'Express',
    sublabel: '~3 min',
    badge: 'Express (~3 min)',
    shortDescription: 'Moment calme express',
    description: 'Une micro-aventure rapide et apaisante (~3 min)',
  },
  5: {
    minutes: 5,
    label: 'Courte',
    sublabel: '~5 min',
    badge: 'Courte (~5 min)',
    shortDescription: 'Histoire courte et douce',
    description: 'Une histoire courte et douce (~5 min)',
  },
  10: {
    minutes: 10,
    label: 'Moyenne',
    sublabel: '~10 min',
    badge: 'Moyenne (~10 min)',
    shortDescription: "L'histoire du soir idéale",
    description: "Le format idéal pour le rituel du coucher (~10 min)",
  },
  15: {
    minutes: 15,
    label: 'Longue',
    sublabel: '~15 min',
    badge: 'Longue (~15 min)',
    shortDescription: 'Grande aventure immersive',
    description: 'Une grande aventure riche et captivante (~15 min)',
  },
};

export const getStoryDurationConfig = (minutes?: number | null): StoryDurationOption => {
  if (minutes === 3 || minutes === 5 || minutes === 10 || minutes === 15) {
    return STORY_DURATION_CONFIG[minutes];
  }
  return STORY_DURATION_CONFIG[10];
};

// Rough reading speed for kids-friendly text (words per minute)
// Unification avec la constante utilisée dans l'affichage du temps de lecture
import { READING_SPEED_WPM } from '@/utils/readingTime';

export const AVERAGE_WPM = READING_SPEED_WPM;

export interface DurationWordBounds {
  minWords: number;
  targetWords: number;
  maxWords: number;
}

/**
 * Calcule les bornes de mots (min, cible, max strict) pour une durée demandée.
 * Le maxWords est rigoureusement calibré sous la barre des minutes supérieures
 * pour garantir qu'à l'affichage comme à l'écoute, une histoire de 3 min ne bascule jamais à 4 ou 5 min.
 */
export const getDurationWordBounds = (minutes: number, customWpm?: number): DurationWordBounds => {
  const wpm = customWpm && customWpm >= 50 && customWpm <= 300 ? customWpm : AVERAGE_WPM;

  if (minutes <= 3) {
    const target = Math.round(wpm * 2.5); // ~300 mots à 120 wpm, ~288 à 115 wpm
    const min = Math.max(200, Math.round(target * 0.85)); // ~255 mots
    const max = Math.round(wpm * 2.85); // ~342 mots à 120 wpm, ~328 à 115 wpm
    return { minWords: min, targetWords: target, maxWords: max };
  } else if (minutes <= 5) {
    const target = Math.round(wpm * 4.3); // ~516 mots à 120 wpm
    const min = Math.round(target * 0.88); // ~454 mots
    const max = Math.round(wpm * 4.8); // ~576 mots à 120 wpm
    return { minWords: min, targetWords: target, maxWords: max };
  } else if (minutes <= 10) {
    const target = Math.round(wpm * 8.8); // ~1056 mots à 120 wpm
    const min = Math.round(target * 0.9);
    const max = Math.round(wpm * 9.6); // ~1152 mots à 120 wpm
    return { minWords: min, targetWords: target, maxWords: max };
  } else {
    const target = Math.round(wpm * 13.0); // ~1560 mots à 120 wpm
    const min = Math.round(target * 0.9);
    const max = Math.round(wpm * 14.2); // ~1704 mots à 120 wpm
    return { minWords: min, targetWords: target, maxWords: max };
  }
};

export const estimateWordCountForDuration = (minutes: number, customWpm?: number): number => {
  const wpm = customWpm && customWpm >= 50 && customWpm <= 300 ? customWpm : AVERAGE_WPM;
  const words = Math.round(minutes * wpm);
  // Clamp to reasonable bounds (min 200 mots pour 3 min, max 3500)
  return Math.min(Math.max(words, 200), 3500);
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
