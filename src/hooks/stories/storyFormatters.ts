
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

  // Validation du statut
  const validStatus = ['completed', 'pending', 'read'].includes(data.status) 
    ? data.status 
    : 'pending';

  // Validation du contenu en fonction du statut
  const storyText = data.story_text || '';
  const preview = data.preview || '';
  
  // Si le status est "completed" mais qu'il n'y a pas de texte, on force le status à "pending"
  const finalStatus = validStatus === 'completed' && !storyText.trim() 
    ? 'pending' 
    : validStatus;

  const story: Story = {
    id: doc.id,
    id_stories: data.id_stories || doc.id,
    authorId: data.authorId || '',
    title: data.title || '',
    preview: finalStatus === 'completed' ? preview : "Histoire en cours de génération...",
    objective: data.objective || '',
    childrenIds: Array.isArray(data.childrenIds) ? [...data.childrenIds] : [],
    childrenNames: Array.isArray(data.childrenNames) ? [...data.childrenNames] : [],
    status: finalStatus,
    story_text: finalStatus === 'completed' ? storyText : "Génération en cours...",
    story_summary: data.story_summary || '',
    createdAt: createdAtDate,
    isFavorite: Boolean(data.isFavorite),
    tags: Array.isArray(data.tags) ? [...data.tags] : [],
    sharedWith: Array.isArray(data.sharedWith) ? [...data.sharedWith] : []
  };

  // Log détaillé pour le debugging
  console.log('Story formatted from Firestore:', {
    id: story.id,
    id_stories: story.id_stories,
    status: story.status,
    finalStatus,
    hasStoryText: Boolean(storyText.trim()),
    validStatus,
    title: story.title
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
