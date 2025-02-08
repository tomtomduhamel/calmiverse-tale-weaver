
import { DocumentSnapshot, Timestamp } from 'firebase/firestore';
import type { Story } from '@/types/story';

export const formatStoryFromFirestore = (doc: DocumentSnapshot): Story => {
  const data = doc.data();
  if (!data) throw new Error('Document data is undefined');

  // Validation et conversion du timestamp
  let createdAtDate;
  try {
    createdAtDate = data.createdAt instanceof Timestamp 
      ? data.createdAt.toDate() 
      : new Date();
  } catch (e) {
    console.warn('Erreur lors de la conversion du timestamp:', e);
    createdAtDate = new Date();
  }

  // Validation et logging du statut
  const providedStatus = data.status;
  const validStatus = ['completed', 'pending', 'read'].includes(providedStatus) 
    ? providedStatus 
    : 'pending';

  console.log('Formatage de l\'histoire:', {
    id: doc.id,
    status: {
      original: providedStatus,
      validated: validStatus
    },
    content: {
      hasStoryText: Boolean(data.story_text?.trim()),
      hasPreview: Boolean(data.preview?.trim()),
      textLength: data.story_text?.length || 0
    },
    metadata: {
      createdAt: createdAtDate,
      authorId: data.authorId
    }
  });

  const story: Story = {
    id: doc.id,
    id_stories: data.id_stories || doc.id,
    authorId: data.authorId || '',
    title: data.title || '',
    preview: data.preview || '',
    objective: data.objective || '',
    childrenIds: Array.isArray(data.childrenIds) ? [...data.childrenIds] : [],
    childrenNames: Array.isArray(data.childrenNames) ? [...data.childrenNames] : [],
    status: validStatus,
    story_text: data.story_text || '',
    story_summary: data.story_summary || '',
    createdAt: createdAtDate,
    isFavorite: Boolean(data.isFavorite),
    tags: Array.isArray(data.tags) ? [...data.tags] : [],
    sharedWith: Array.isArray(data.sharedWith) ? [...data.sharedWith] : []
  };

  return story;
};

export const createStoryData = (formData: { childrenIds: string[], objective: string }, childrenNames: string[]) => {
  return {
    title: `Histoire pour ${childrenNames.join(' et ')}`,
    preview: "Histoire en cours de génération...",
    objective: formData.objective,
    childrenIds: [...formData.childrenIds],
    childrenNames: [...childrenNames],
    status: 'pending',
    story_text: "Génération en cours...",
    story_summary: "Résumé en cours de génération...",
    createdAt: Timestamp.now(),
    isFavorite: false,
    tags: [],
    sharedWith: []
  };
};
