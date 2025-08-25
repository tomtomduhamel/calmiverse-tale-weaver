import type { Child } from '@/types/child';
import { calculateAge } from '@/utils/age';
import { estimateWordCountForDuration } from '@/types/story';

interface CharacterAnalysis {
  children: {
    child: Child;
    age: number;
  }[];
  pets: Child[];
  youngestAge: number;
  oldestAge: number;
  averageAge: number;
}

/**
 * Analyse les personnages sélectionnés (enfants et animaux)
 */
export const analyzeCharacters = (children: Child[]): CharacterAnalysis => {
  const childrenWithAges = children
    .filter(child => child.gender !== 'pet')
    .map(child => ({
      child,
      age: calculateAge(child.birthDate)
    }));

  const pets = children.filter(child => child.gender === 'pet');

  const ages = childrenWithAges.map(c => c.age);
  const youngestAge = ages.length > 0 ? Math.min(...ages) : 0;
  const oldestAge = ages.length > 0 ? Math.max(...ages) : 0;
  const averageAge = ages.length > 0 ? Math.round(ages.reduce((sum, age) => sum + age, 0) / ages.length) : 0;

  return {
    children: childrenWithAges,
    pets,
    youngestAge,
    oldestAge,
    averageAge
  };
};

/**
 * Génère le contexte détaillé des personnages pour le prompt
 */
export const generateCharacterContext = (analysis: CharacterAnalysis): string => {
  const { children, pets } = analysis;
  
  let context = "";

  // Contexte des enfants avec genre et âge
  if (children.length > 0) {
    context += "PERSONNAGES PRINCIPAUX :\n";
    children.forEach(({ child, age }) => {
      const genderLabel = child.gender === 'boy' ? 'garçon' : 'fille';
      context += `- ${child.name} : ${genderLabel} de ${age} an${age > 1 ? 's' : ''}\n`;
    });
  }

  // Contexte des animaux de compagnie
  if (pets.length > 0) {
    context += "\nANIMAUX DE COMPAGNIE :\n";
    pets.forEach(pet => {
      context += `- ${pet.name} : animal de compagnie`;
      if (pet.teddyName) {
        context += ` (${pet.teddyName})`;
      }
      context += "\n";
    });
  }

  return context;
};

/**
 * Adapte le vocabulaire selon l'âge le plus jeune
 */
const getVocabularyLevel = (youngestAge: number): string => {
  if (youngestAge <= 3) {
    return "Utilise un vocabulaire simple avec des mots familiers. Utilise quelques onomatopées, sans jamais en abuser pour ne pas rendre l'histoire difficile à lire et à comprendre.";
  } else if (youngestAge <= 5) {
    return "Utilise un vocabulaire simple et accessible. Évite les mots complexes.";
  } else if (youngestAge <= 7) {
    return "Utilise un vocabulaire adapté aux enfants d'âge scolaire. Introduis quelques mots nouveaux avec contexte.";
  } else {
    return "Utilise un vocabulaire plus riche et varié. Peux introduire des concepts plus complexes de manière adaptée aux enfants.";
  }
};

/**
 * Génère les instructions spécifiques selon les genres présents
 */
const generateGenderInstructions = (analysis: CharacterAnalysis): string => {
  const { children, pets } = analysis;
  const boys = children.filter(c => c.child.gender === 'boy');
  const girls = children.filter(c => c.child.gender === 'girl');
  
  let instructions = "";

  if (boys.length > 0 && girls.length === 0) {
    instructions += "- Intègre des éléments d'aventure, d'exploration et d'action adaptés aux garçons\n";
  } else if (girls.length > 0 && boys.length === 0) {
    instructions += "- Intègre des éléments créatifs, relationnels et émotionnels adaptés aux filles\n";
  } else if (boys.length > 0 && girls.length > 0) {
    instructions += "- Équilibre les éléments d'aventure et de créativité pour plaire aux garçons et aux filles\n";
    instructions += "- Favorise la coopération et l'amitié entre les personnages\n";
  }

  if (pets.length > 0) {
    instructions += "- Intègre les animaux de compagnie comme personnages importants avec leurs propres traits de caractère\n";
    instructions += "- Montre la relation spéciale entre les enfants et leurs animaux\n";
  }

  return instructions;
};

/**
 * Génère le prompt d'histoire avancé avec contexte multi-personnages et adaptation d'âge
 */
export const generateAdvancedStoryPrompt = (
  objective: string,
  children: Child[],
  selectedTitle?: string,
  options?: { durationMinutes?: number; targetWordCount?: number }
): string => {
  const analysis = analyzeCharacters(children);
  const characterContext = generateCharacterContext(analysis);
  const vocabularyInstructions = getVocabularyLevel(analysis.youngestAge);
  const genderInstructions = generateGenderInstructions(analysis);

  const targetWords = options?.targetWordCount ?? (options?.durationMinutes ? estimateWordCountForDuration(options.durationMinutes) : 1500);
  const startWords = Math.max(200, Math.round(targetWords * 0.25));
  const middleWords = Math.max(400, Math.round(targetWords * 0.5));
  const endWords = Math.max(200, Math.round(targetWords * 0.25));

  // Construire la liste des noms pour le texte
  const allNames = [...analysis.children.map(c => c.child.name), ...analysis.pets.map(p => p.name)];
  const namesText = allNames.length === 1
    ? allNames[0]
    : `${allNames.slice(0, -1).join(', ')} et ${allNames[allNames.length - 1]}`;

  // Prompts par objectif adaptés au contexte multi-personnages
  const objectivePrompts = {
    sleep: `Créer une histoire douce et apaisante pour aider ${namesText} à s'endormir. L'histoire doit être calme, réconfortante et se terminer de manière paisible. Utilisez un langage simple et des images relaxantes. L'histoire doit utiliser les techniques d'hypnose ericksonienne pour permettre un endormissement apaisé et régénérateur.`,
    focus: `Créer une histoire engageante qui aide ${namesText} à se concentrer. L'histoire doit captiver l'attention tout en étant éducative et stimulante intellectuellement. Intègre des défis et des mystères adaptés à leur âge.`,
    relax: `Créer une histoire relaxante pour aider ${namesText} à se détendre. L'histoire doit être apaisante, avec un rythme lent et des éléments qui favorisent la relaxation. Privilégie les paysages naturels et les moments de contemplation.`,
    fun: `Créer une histoire amusante et divertissante pour ${namesText}. L'histoire doit être joyeuse, pleine d'aventures et de moments ludiques qui feront sourire. Intègre de l'humour adapté à leur âge.`
  } as const;

  const basePrompt = objectivePrompts[objective as keyof typeof objectivePrompts] ||
    `Créer une histoire pour enfants personnalisée pour ${namesText} avec pour objectif: ${objective}.`;

  let titleInstruction = "";
  if (selectedTitle) {
    titleInstruction = `Le titre de l'histoire doit être : "${selectedTitle}". Assure-toi que l'histoire correspond bien à ce titre et développe le thème de manière créative et engageante.\n\n`;
  }

  const durationNote = options?.durationMinutes
    ? `- L'histoire doit pouvoir être lue en environ ${options.durationMinutes} minutes\n`
    : "";

  return `${basePrompt}

${titleInstruction}${characterContext}

ADAPTATION D'ÂGE ET VOCABULAIRE :
${vocabularyInstructions}
- Âge des enfants : de ${analysis.youngestAge} à ${analysis.oldestAge} ans (moyenne: ${analysis.averageAge} ans)
- Adapte la complexité narrative à l'âge le plus jeune pour que tous puissent suivre
- Si plusieurs âges, crée des niveaux de lecture multiples dans la même histoire

INSTRUCTIONS SPÉCIFIQUES AUX GENRES :
${genderInstructions}
- Évite tous stéréotypes de genre tout en respectant les préférences naturelles
- Valorise l'égalité et la complémentarité entre tous les personnages

INSTRUCTIONS POUR LA GÉNÉRATION :
- Personnaliser l'histoire avec tous les prénoms : ${namesText}
- Créer une histoire d'environ ${targetWords} mots décomposée ainsi : début (~${startWords} mots), développement (~${middleWords} mots), fin (~${endWords} mots)
- Structurer avec un début, un développement et une fin satisfaisante avec des sauts de lignes pour faciliter la lecture
- Inclure des éléments magiques ou imaginaires adaptés à l'enfance
- S'assurer que l'histoire respecte l'objectif: ${objective}
- Utiliser un ton bienveillant et positif sans utiliser trop de superlatifs
- Interdire tout contenu effrayant ou inapproprié
- Développer les relations entre les personnages selon leurs caractéristiques
${durationNote}
Générer maintenant l'histoire complète en français en respectant le nombre de mots demandés (environ ${targetWords} mots).`;
};