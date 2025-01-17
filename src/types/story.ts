export interface Story {
  id: string;
  id_stories?: string;
  title: string;
  preview: string;
  objective: string | { name: string; value: string };
  childrenIds: string[];
  childrenNames?: string[];
  createdAt: Date;
  status: 'pending' | 'completed' | 'read';
  story_text: string;
  story_summary: string;
  isFavorite?: boolean;
  tags?: string[];
  epubFile?: string;
  authorId?: string;
  sharedWith?: string[];
}

export interface Objective {
  id: string;
  label: string;
  value: string;
}