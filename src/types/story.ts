export interface Story {
  id: string;
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
}