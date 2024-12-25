import { collection, addDoc, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import type { StoryTheme, StoryObjective } from '@/types/story-theme';

const DEFAULT_THEME: Omit<StoryTheme, 'id'> = {
  name: "Histoire magique",
  description: "Une histoire magique et apaisante",
  prompt: `Crée une histoire magique et apaisante pour {children}. 
    L'histoire doit être adaptée à leur âge et inclure des éléments magiques et réconfortants.
    Si l'objectif est {objective}, l'histoire doit particulièrement se concentrer sur cet aspect.`
};

export const getStoryThemes = async (): Promise<StoryTheme[]> => {
  try {
    console.log('Fetching story themes from Firestore...');
    const themesCollection = collection(db, 'story_themes');
    const snapshot = await getDocs(themesCollection);
    const themes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StoryTheme));
    
    // Si aucun thème n'existe, créer le thème par défaut
    if (themes.length === 0) {
      console.log('No themes found, creating default theme...');
      const docRef = await addDoc(themesCollection, DEFAULT_THEME);
      return [{ id: docRef.id, ...DEFAULT_THEME }];
    }
    
    return themes;
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