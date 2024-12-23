import { collection, addDoc, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import type { StoryTheme, StoryObjective } from '@/types/story-theme';

export const getStoryThemes = async (): Promise<StoryTheme[]> => {
  try {
    console.log('Fetching story themes from Firestore...');
    const themesCollection = collection(db, 'story_themes');
    const snapshot = await getDocs(themesCollection);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StoryTheme));
  } catch (error) {
    console.error('Error fetching story themes:', error);
    throw error;
  }
};

export const createStoryTheme = async (theme: Omit<StoryTheme, 'id'>): Promise<string> => {
  try {
    console.log('Creating new story theme:', theme);
    const themesCollection = collection(db, 'story_themes');
    const docRef = await addDoc(themesCollection, theme);
    return docRef.id;
  } catch (error) {
    console.error('Error creating story theme:', error);
    throw error;
  }
};

export const generateStoryPrompt = (theme: StoryTheme, objective: StoryObjective, childrenNames: string[]): string => {
  const basePrompt = theme.prompt
    .replace('{children}', childrenNames.join(' et '))
    .replace('{objective}', objective);

  return `
Tu es un conteur d'histoires expert pour enfants. Crée une histoire courte et engageante avec ces instructions:

${basePrompt}

L'histoire doit:
- Être adaptée aux enfants
- Durer environ 5-7 minutes à lire
- Inclure des éléments interactifs simples
- Avoir une fin apaisante
- Utiliser un langage simple et clair
- Éviter tout contenu effrayant ou négatif

Format de réponse:
- Titre: [titre de l'histoire]
- Histoire: [contenu de l'histoire]
`;
};