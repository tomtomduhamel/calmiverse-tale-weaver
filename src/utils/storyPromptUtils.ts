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
      let petTypeLabel = "";
      if (pet.petType === 'dog') petTypeLabel = "chien";
      else if (pet.petType === 'cat') petTypeLabel = "chat";
      else if (pet.petType === 'other' && pet.petTypeCustom) petTypeLabel = pet.petTypeCustom;
      else petTypeLabel = "animal de compagnie";

      context += `- ${pet.name} : ${petTypeLabel}`;
      if (pet.teddyDescription) {
        context += ` (${pet.teddyDescription})`;
      }
      context += "\n";
    });
  }

  return context;
};

export const getVocabularyInstructions = (youngestAge: number): string => {
  const onomatopoeiaRule = "- RÈGLE DES ONOMATOPÉES : Maximum 3 onomatopées dans TOUTE l'histoire (ex: Hop !, Plouf !, Chut...).";
  const metaphorRule = "- RÈGLE ZÉRO MÉTAPHORE SUPERFLUE : Maximum 1 à 2 comparaisons physiques simples dans toute l'histoire (ex: 'un ballon gros comme une pastèque'). INTERDICTION FORMELLE des comparaisons poétiques lentes ('comme du miel', 'comme une onde', 'comme une offrande', 'comme un pli dans le ciel'). Raconter l'action avec des verbes directs et vivants.";
  const blacklistRule = "- LISTE NOIRE STRICTE (MOTS PROSCRITS) : Ne JAMAIS utiliser les mots suivants : 'irisé', 'nacre', 'nacré', 'diaphane', 'béatitude', 'onde', 'offrande', 'cérémonieux', 'cérémonieuse', 'murmure machinal', 'alcôve', 'zéphyr', 'lueur feutrée', 'contemplation', 'indicible'.";

  if (youngestAge <= 3) {
    return `- VOCABULAIRE TOUT-PETITS (0-3 ans) : Phrases très courtes (Sujet + Verbe + Complément). Mots simples et concrets du quotidien direct (doudou, chat, pomme, bain, dodo, ballon). Interdiction totale du vocabulaire abstrait ou littéraire.\n${metaphorRule}\n${blacklistRule}\n${onomatopoeiaRule}`;
  } else if (youngestAge <= 5) {
    return `- VOCABULAIRE MATERNELLE (4-6 ans) : Vocabulaire simple, vivant, concret et chaleureux. Verbes d'action directs (courir, grimper, cacher, rire, attraper). Aucun terme pompeux ou complexe.\n${metaphorRule}\n${blacklistRule}\n${onomatopoeiaRule}`;
  } else if (youngestAge <= 7) {
    return `- VOCABULAIRE PRIMAIRE (7-8 ans) : Vocabulaire adapté à l'école primaire. Maximum 2 à 3 mots enrichissants immédiatement compréhensibles en contexte. Syntaxe claire et vivante.\n${metaphorRule}\n${blacklistRule}\n${onomatopoeiaRule}`;
  } else if (youngestAge <= 12) {
    return `- VOCABULAIRE JUNIOR (8-12 ans) : Vocabulaire riche mais fluide et accessible. Dialogues rythmés, esprit vif, sans tournures artificiellement vieillottes.\n${metaphorRule}\n${blacklistRule}\n${onomatopoeiaRule}`;
  } else {
    return `- VOCABULAIRE ADO (13+ ans) : Vocabulaire précis et dynamique. Dialogues modernes avec autodérision bienveillante et maturité, sans infantilisation.\n${metaphorRule}\n${blacklistRule}\n${onomatopoeiaRule}`;
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
  const vocabularyInstructions = getVocabularyInstructions(analysis.youngestAge);
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

  const comedyByAge = analysis.youngestAge <= 3
    ? "Comique visuel et physique simple, animaux maladroits, petits coucous-cachés."
    : analysis.youngestAge <= 6
    ? "Quiproquos loufoques, bêtises innocentes, doudou gaffeur, inversion des rôles où l'enfant guide l'adulte/l'animal."
    : analysis.youngestAge <= 10
    ? "Aventures rythmées, chasses aux trésors déjantées, comique de répétition et chutes inattendues."
    : "Dialogues piquants, ironie bienveillante, autodérision et situations absurdes.";

  const objectivePrompts = {
    sleep: `Créer une histoire douce, enveloppante et progressive pour accompagner paisiblement ${namesText} vers le sommeil.
DYNAMIQUE SOMMEIL : Utiliser les techniques de descente hypnotique progressive (ralentissement progressif du rythme, métaphores de cocon moelleux et paupières agréablement lourdes). L'histoire s'achève sur un endormissement calme et réparateur.`,
    focus: `Créer une histoire stimulante et palpitante qui entraîne la concentration et l'observation de ${namesText}.
DYNAMIQUE FOCUS : Intègre une énigme claire dès le départ, des indices visuels concrets à repérer, et un suspense haletant où les enfants déduisent la solution. Ton alerte, clair et passionnant.`,
    relax: `Créer une histoire apaisante et bienveillante pour offrir un moment de détente et de sérénité à ${namesText}.
DYNAMIQUE DÉTENTE : Contemplation douce, paysages chaleureux et respiration agréable sans obligation de s'endormir.`,
    fun: `Créer une histoire très drôle, dynamique et joyeuse pour ${namesText}.
DYNAMIQUE S'AMUSER (ÉNERGIE HAUTE & RIRE) :
- L'histoire doit faire rire, donner de l'énergie et mettre le sourire aux lèvres !
- RESSORT COMIQUE ADAPTÉ À L'ÂGE : ${comedyByAge}
- INTERDICTION FORMELLE : Ne jamais utiliser de ton lénifiant, de lenteur monotone, de métaphores poétiques ou d'invitation au sommeil. L'histoire doit être vivante, concrète et pétillante.`
  } as const;

  const basePrompt = objectivePrompts[objective as keyof typeof objectivePrompts] ||
    `Créer une histoire pour enfants personnalisée pour ${namesText} avec pour objectif: ${objective}.`;

  let titleInstruction = "";
  if (selectedTitle) {
    titleInstruction = `TITRE SÉLECTIONNÉ : "${selectedTitle}". Développe une intrigue surprenante et dynamique autour de ce titre.\n\n`;
  }

  const durationNote = options?.durationMinutes
    ? `- L'histoire doit pouvoir être lue en environ ${options.durationMinutes} minutes\n`
    : "";

  return `MODÈLE NARRATIF EN 2 TEMPS :
1. Temps 1 (Accroche sensorielle - 30-45s) : Capte immédiatement l'attention par un détail sensoriel curieux, un bruit rigolo ou une surprise pour déconnecter des pensées parasites et ancrer ${namesText} dans le moment présent.
2. Temps 2 (Trame Narrative de Cause à Effet à 100%) : Déploie une intrigue continue et vivante.

${basePrompt}

${titleInstruction}${characterContext}

TRAME NARRATIVE DE CAUSE À EFFET CONTINUE (INDISPENSABLE POUR LA CAPTATION) :
- 1. MINI-ENJEU CLAIR DÈS LE DÉPART : Pose un défi ou problème tangible dès la première minute (ex: objet en fuite, compte à rebours, bêtise à réparer avant un événement).
- 2. ENFANTS ACTEURS & DÉCIDEURS : ${namesText} prennent les initiatives, élaborent les ruses et résolvent le problème. Ils ne sont jamais spectateurs passifs.
- 3. RÈGLE DU "ET DONC... / MAIS ALORS..." : Chaque action des enfants doit provoquer un rebondissement ou une surprise qui mène à la scène suivante. Pas de déambulation descriptive statique.
- 4. DIALOGUES VIVANTS : Insérer de vraies répliques spontanées d'enfants.

CALIBRAGE DU VOCABULAIRE & RÈGLE DU CONCRET :
${vocabularyInstructions}
- Âge des enfants : de ${analysis.youngestAge} à ${analysis.oldestAge} ans (moyenne: ${analysis.averageAge} ans)
- INTERDICTION FORMELLE DES TICS HYPNOTIQUES PASSIFS : Si l'objectif n'est pas le sommeil, proscrire les phrases du type 'en laissant leurs épaules s'abaisser', 'peut-être en inspirant', 'le monde s'apaise comme une respiration lente'.

STRUCTURE NARRATIVE (~${targetWords} mots) :
- Début (~${startWords} mots) : Accroche immédiate et découverte du défi/problème.
- Péripéties (~${middleWords} mots) : Actions rythmées de cause à effet, dialogues vivants et progression de l'objectif.
- Dénouement (~${endWords} mots) : Résolution satisfaisante par les enfants (rire et énergie pour fun, énigme résolue pour focus, élan d'action/fierté pour les émotions de jour, sommeil paisible uniquement pour sleep).
- Structure avec des sauts de lignes pour faciliter la lecture à voix haute.
- Interdire tout contenu effrayant ou angoissant.
${durationNote}
Générer maintenant l'histoire complète en français en respectant le nombre de mots demandés (environ ${targetWords} mots).`;
};