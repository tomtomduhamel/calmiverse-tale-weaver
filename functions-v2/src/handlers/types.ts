
import * as admin from 'firebase-admin';

export interface StoryGenerationRequest {
  storyId?: string;
  objective: string;
  childrenNames: string[];
}

export interface StoryData {
  id_stories: string;
  story_text: string;
  story_summary: string;
  status: 'pending' | 'completed' | 'error';
  createdAt: Date;
  title: string;
  preview: string;
  childrenNames: string[];
  objective: string | { value: string };
  error?: string;
  updatedAt?: admin.firestore.FieldValue;
}

export interface StoryResponse {
  success: boolean;
  storyData: any;
}
