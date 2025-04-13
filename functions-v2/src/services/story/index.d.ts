
declare module 'story' {
  // Déclarer les types nécessaires pour le module 'story'
  export interface StoryData {
    id_stories: string;
    story_text: string;
    story_summary: string;
    status: 'pending' | 'completed' | 'error';
    createdAt: Date;
    title: string;
    preview: string;
    childrenNames: string[];
    objective: string;
    error?: string;
    updatedAt?: any;
  }

  export interface StoryFormattingOptions {
    includeTitle?: boolean;
    maxPreviewLength?: number;
  }
}
