
import { DocumentSnapshot, Timestamp } from 'firebase/firestore';
import { auth } from '@/lib/firebase';
import type { Story } from '@/types/story';

export const formatStoryFromFirestore = (doc: DocumentSnapshot): Story => {
  const data = doc.data();
  if (!data) {
    console.error('Document data is undefined:', doc.id);
    throw new Error('Document data is undefined');
  }

  console.log('Formatage des données brutes:', {
    docId: doc.id,
    authorId: data.authorId,
    currentUser: auth.currentUser?.uid,
    status: data.status,
    hasContent: Boolean(data.story_text?.trim())
  });

  let createdAtDate;
  try {
    createdAtDate = data.createdAt instanceof Timestamp 
      ? data.createdAt.toDate() 
      : new Date();
  } catch (e) {
    console.error('Erreur timestamp pour document:', doc.id, e);
    createdAtDate = new Date();
  }

  const story: Story = {
    id: doc.id,
    id_stories: data.id_stories || doc.id,
    authorId: data.authorId || auth.currentUser?.uid || '',
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

  console.log('Histoire formatée:', {
    id: story.id,
    authorId: story.authorId,
    status: story.status,
    hasContent: Boolean(story.story_text?.trim())
  });

  return story;
};

export const createStoryData = (formData: { childrenIds: string[], objective: string }, childrenNames: string[]) => {
  if (!auth.currentUser) {
    throw new Error("Utilisateur non connecté");
  }

  const storyData = {
    authorId: auth.currentUser.uid,
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

  console.log('Création nouvelle histoire avec authorId:', {
    authorId: storyData.authorId,
    status: storyData.status
  });

  return storyData;
};
