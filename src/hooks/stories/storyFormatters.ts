
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { Story } from '@/types/story';

export const formatStoryFromFirestore = async (storyData: any): Promise<Story> => {
  console.warn('formatStoryFromFirestore est obsolète, utiliser formatStoryFromSupabase.');
  
  if (!storyData) {
    console.error('Les données de l\'histoire sont indéfinies');
    throw new Error('Document data is undefined');
  }

  let createdAtDate;
  try {
    createdAtDate = storyData.createdAt instanceof Date
      ? storyData.createdAt
      : new Date(storyData.createdAt || storyData.createdat || Date.now());
  } catch (e) {
    console.error('Erreur de traitement de date:', e);
    createdAtDate = new Date();
  }

  // Validation du statut basée sur le contenu
  const hasValidContent = Boolean(storyData.story_text?.trim() || storyData.content?.trim());
  const status = hasValidContent && storyData.status === 'pending' ? 'completed' : storyData.status;

  const { data: userData } = await supabase.auth.getUser();

  const story: Story = {
    id: storyData.id,
    id_stories: storyData.id_stories || storyData.id,
    authorId: storyData.authorId || storyData.authorid || userData.user?.id || '',
    title: storyData.title || '',
    preview: storyData.preview || '',
    objective: storyData.objective || '',
    childrenIds: Array.isArray(storyData.childrenIds) ? [...storyData.childrenIds] : 
              (Array.isArray(storyData.childrenids) ? [...storyData.childrenids] : []),
    childrenNames: Array.isArray(storyData.childrenNames) ? [...storyData.childrenNames] :
                (Array.isArray(storyData.childrennames) ? [...storyData.childrennames] : []),
    status: status || 'pending',
    story_text: storyData.story_text || storyData.content || '',
    story_summary: storyData.story_summary || storyData.summary || '',
    createdAt: createdAtDate,
    isFavorite: Boolean(storyData.isFavorite),
    tags: Array.isArray(storyData.tags) ? [...storyData.tags] : [],
    sharedWith: Array.isArray(storyData.sharedWith) ? [...storyData.sharedWith] : [],
    _version: storyData._version || 1,
    _lastSync: storyData._lastSync,
    _pendingWrites: Boolean(storyData._pendingWrites)
  };

  return story;
};

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
