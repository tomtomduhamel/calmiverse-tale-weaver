
export type Story = {
  id: string;
  story_text: string;
  summary: string;
  createdAt: string;
  title: string;
  preview: string;
  wordCount: number;
  status: 'pending' | 'completed' | 'read';
  objective: string;
  childrenNames: string[];
  _version?: number;
  _lastSync?: any;
  _pendingWrites?: boolean;
};

export interface StoryGenerationRequest {
  storyId: string;
  objective: string;
  childrenNames: string[];
  apiKey?: string;
}

// Type guard pour les erreurs
export const isFirebaseError = (error: unknown): error is { message: string } => {
  return typeof error === 'object' && error !== null && 'message' in error;
};
