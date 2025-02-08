
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

  // Validation du statut avec logs détaillés
  const providedStatus = data.status;
  console.log('Status from Firestore:', {
    providedStatus,
    docId: doc.id,
    hasStoryText: Boolean(data.story_text?.trim())
  });

  // Validation du statut
  const validStatus = ['completed', 'pending', 'read'].includes(providedStatus) 
    ? providedStatus 
    : 'pending';

  // Validation du contenu
  const storyText = data.story_text || '';
  const preview = data.preview || '';

  const story: Story = {
    id: doc.id,
    id_stories: data.id_stories || doc.id,
    authorId: data.authorId || '',
    title: data.title || '',
    preview: validStatus === 'completed' ? preview : "Histoire en cours de génération...",
    objective: data.objective || '',
    childrenIds: Array.isArray(data.childrenIds) ? [...data.childrenIds] : [],
    childrenNames: Array.isArray(data.childrenNames) ? [...data.childrenNames] : [],
    status: validStatus,
    story_text: validStatus === 'completed' ? storyText : "Génération en cours...",
    story_summary: data.story_summary || '',
    createdAt: createdAtDate,
    isFavorite: Boolean(data.isFavorite),
    tags: Array.isArray(data.tags) ? [...data.tags] : [],
    sharedWith: Array.isArray(data.sharedWith) ? [...data.sharedWith] : []
  };

  console.log('Story formatted from Firestore:', {
    id: story.id,
    status: story.status,
    hasStoryText: Boolean(storyText.trim()),
    originalStatus: providedStatus,
    finalStatus: validStatus
  });

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
