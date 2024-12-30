import { DocumentSnapshot, Timestamp } from 'firebase/firestore';
import type { Story } from '@/types/story';

export const formatStoryFromFirestore = (doc: DocumentSnapshot): Story => {
  const data = doc.data();
  if (!data) throw new Error('Document data is undefined');

  // Conversion sécurisée du timestamp
  let createdAtDate;
  try {
    createdAtDate = data.createdAt?.toDate?.() || new Date();
  } catch (e) {
    console.warn('Erreur lors de la conversion du timestamp:', e);
    createdAtDate = new Date();
  }

  // Création d'un objet simple et clonable
  const story: Story = {
    id: doc.id,
    id_stories: data.id_stories || `story_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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
    tags: Array.isArray(data.tags) ? [...data.tags] : []
  };

  return story;
};

export const createStoryData = (formData: { childrenIds: string[], objective: string }, childrenNames: string[]) => {
  const uniqueId = `story_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  return {
    id_stories: uniqueId,
    title: `Histoire pour ${childrenNames.join(' et ')}`,
    preview: "Histoire en cours de génération...",
    objective: formData.objective,
    childrenIds: [...formData.childrenIds],
    childrenNames: [...childrenNames],
    status: 'pending',
    story_text: "Génération en cours...",
    story_summary: "Résumé en cours de génération...",
    createdAt: Timestamp.now()
  };
};