
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
  settings?: StorySettings;
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
