
import { DocumentSnapshot, Timestamp } from 'firebase/firestore';
import type { Story } from '@/types/story';

export const formatStoryFromFirestore = (doc: DocumentSnapshot): Story => {
  const data = doc.data();
  if (!data) {
    console.error('Document data is undefined:', doc.id);
    throw new Error('Document data is undefined');
  }

  // Conversion du timestamp avec logging détaillé
  let createdAtDate;
  try {
    createdAtDate = data.createdAt instanceof Timestamp 
      ? data.createdAt.toDate() 
      : new Date();

    console.log('Timestamp conversion:', {
      docId: doc.id,
      original: data.createdAt,
      converted: createdAtDate,
      isTimestamp: data.createdAt instanceof Timestamp
    });
  } catch (e) {
    console.error('Erreur timestamp pour document:', doc.id, e);
    createdAtDate = new Date();
  }

  // Log détaillé des données brutes
  console.log('Données brutes de Firestore:', {
    docId: doc.id,
    rawData: {
      status: data.status,
      storyText: data.story_text?.substring(0, 50) + '...',
      createdAt: createdAtDate,
      title: data.title
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
    status: data.status || 'pending',
    story_text: data.story_text || '',
    story_summary: data.story_summary || '',
    createdAt: createdAtDate,
    isFavorite: Boolean(data.isFavorite),
    tags: Array.isArray(data.tags) ? [...data.tags] : [],
    sharedWith: Array.isArray(data.sharedWith) ? [...data.sharedWith] : []
  };

  // Log de l'objet formaté
  console.log('Histoire formatée:', {
    id: story.id,
    status: story.status,
    hasContent: Boolean(story.story_text?.trim()),
    contentLength: story.story_text?.length,
    createdAt: story.createdAt
  });

  return story;
};

export const createStoryData = (formData: { childrenIds: string[], objective: string }, childrenNames: string[]) => {
  const storyData = {
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

  console.log('Création nouvelle histoire:', storyData);
  return storyData;
};
