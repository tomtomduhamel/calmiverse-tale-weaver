
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { Story } from '@/types/story';

export const formatStoryFromSupabase = (storyData: any): Story => {
  if (!storyData) {
    console.error('Les données de l\'histoire sont indéfinies');
    throw new Error('Document data is undefined');
  }

  const createdAtDate = new Date(storyData.createdat || Date.now());
  
  // Normaliser les données pour correspondre au type Story
  const story: Story = {
    id: storyData.id,
    id_stories: storyData.id,
    authorId: storyData.authorid || '',
    title: storyData.title || '',
    preview: storyData.preview || '',
    objective: storyData.objective || '',
    childrenIds: Array.isArray(storyData.childrenids) ? [...storyData.childrenids] : [],
    childrenNames: Array.isArray(storyData.childrennames) ? [...storyData.childrennames] : [],
    status: storyData.status || 'pending',
    story_text: storyData.content || '',
    story_summary: storyData.summary || '',
    createdAt: createdAtDate,
    isFavorite: Boolean(storyData.is_favorite),
    tags: Array.isArray(storyData.tags) ? [...storyData.tags] : [],
    sharedWith: Array.isArray(storyData.shared_with) ? [...storyData.shared_with] : [],
    _version: 1,
    error: storyData.error || undefined
  };

  return story;
};

export const createStoryData = (formData: { childrenIds: string[], objective: string }, childrenNames: string[]) => {
  return {
    title: `Histoire pour ${childrenNames.join(' et ')}`,
    content: "Génération en cours...",
    summary: "Résumé en cours de génération...",
    preview: "Histoire en cours de génération...",
    objective: formData.objective,
    childrenids: [...formData.childrenIds],
    childrennames: [...childrenNames],
    status: 'pending',
    createdat: new Date().toISOString(),
    updatedat: new Date().toISOString(),
    is_favorite: false
  };
};
