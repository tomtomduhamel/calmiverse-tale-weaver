export interface Story {
  id: string;
  title: string;
  preview: string;
  objective: string | { name: string; value: string };
  childrenIds: string[];
  createdAt: Date;
  status: 'pending' | 'completed';
  story_text: string;
  story_summary: string;
  isFavorite?: boolean;
  tags?: string[];
}