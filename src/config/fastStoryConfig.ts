// ─── Fast Story Configuration ───────────────────────────────────────────────
// Defines all Emotions and Situations available in the "Histoires rapides" feature.
// Each item maps to a unique prompt key in the admin prompt_templates table.

export type FastStorySection = 'regulation' | 'renforcement' | 'situation';

export interface FastStoryItem {
  id: string;
  label: string;
  description: string;
  icon: string; // Emoji
  promptKey: string; // Maps to DB key in prompt_templates
  section: FastStorySection;
  // Gradient colors for card background (tailwind-compatible classes)
  gradientFrom: string;
  gradientTo: string;
}

// ─── Section 1 : Émotions à apaiser (Régulation) ────────────────────────────
export const FAST_STORIES_REGULATION: FastStoryItem[] = [
  {
    id: 'fear',
    label: 'peur',
    description: 'Peur du noir, cauchemars, phobies',
    icon: '🌑',
    promptKey: 'fast_story_fear',
    section: 'regulation',
    gradientFrom: 'from-indigo-900/40',
    gradientTo: 'to-slate-800/40',
  },
  {
    id: 'anxiety',
    label: 'anxiété',
    description: 'Angoisse, inquiétudes profondes',
    icon: '🌀',
    promptKey: 'fast_story_anxiety',
    section: 'regulation',
    gradientFrom: 'from-violet-900/40',
    gradientTo: 'to-indigo-900/40',
  },
  {
    id: 'anger',
    label: 'colère',
    description: 'Frustration, impulsivité, tempête intérieure',
    icon: '🌋',
    promptKey: 'fast_story_anger',
    section: 'regulation',
    gradientFrom: 'from-rose-900/40',
    gradientTo: 'to-orange-800/40',
  },
  {
    id: 'sadness',
    label: 'tristesse',
    description: 'Chagrin, deuil, séparation',
    icon: '🌧️',
    promptKey: 'fast_story_sadness',
    section: 'regulation',
    gradientFrom: 'from-blue-900/40',
    gradientTo: 'to-slate-700/40',
  },
  {
    id: 'stress',
    label: 'stress',
    description: 'Examens, trac, pression scolaire',
    icon: '⚡',
    promptKey: 'fast_story_stress',
    section: 'regulation',
    gradientFrom: 'from-amber-800/40',
    gradientTo: 'to-yellow-700/40',
  },
  {
    id: 'agitation',
    label: 'agitation',
    description: 'Impulsivité, débordement d\'énergie',
    icon: '🌪️',
    promptKey: 'fast_story_agitation',
    section: 'regulation',
    gradientFrom: 'from-teal-800/40',
    gradientTo: 'to-cyan-700/40',
  },
  {
    id: 'guilt',
    label: 'culpabilité',
    description: 'Se sentir mauvais, honte intérieure',
    icon: '🪨',
    promptKey: 'fast_story_guilt',
    section: 'regulation',
    gradientFrom: 'from-stone-700/40',
    gradientTo: 'to-slate-800/40',
  },
  {
    id: 'pain',
    label: 'douleur',
    description: 'Douleur physique ou émotionnelle',
    icon: '🩹',
    promptKey: 'fast_story_pain',
    section: 'regulation',
    gradientFrom: 'from-red-800/40',
    gradientTo: 'to-rose-700/40',
  },
];

// ─── Section 2 : Ressources à stimuler (Renforcement) ───────────────────────
export const FAST_STORIES_RENFORCEMENT: FastStoryItem[] = [
  {
    id: 'confidence',
    label: 'confiance en soi',
    description: 'Estime de soi, croire en ses capacités',
    icon: '⭐',
    promptKey: 'fast_story_confidence',
    section: 'renforcement',
    gradientFrom: 'from-amber-700/40',
    gradientTo: 'to-yellow-600/40',
  },
  {
    id: 'serenity',
    label: 'sérénité',
    description: 'Calme intérieur, paix profonde',
    icon: '🌿',
    promptKey: 'fast_story_serenity',
    section: 'renforcement',
    gradientFrom: 'from-emerald-700/40',
    gradientTo: 'to-teal-600/40',
  },
  {
    id: 'joy',
    label: 'joie',
    description: 'Enthousiasme, bonne humeur, légèreté',
    icon: '☀️',
    promptKey: 'fast_story_joy',
    section: 'renforcement',
    gradientFrom: 'from-yellow-600/40',
    gradientTo: 'to-orange-500/40',
  },
  {
    id: 'courage',
    label: 'courage',
    description: 'Force intérieure, dépasser ses peurs',
    icon: '🦁',
    promptKey: 'fast_story_courage',
    section: 'renforcement',
    gradientFrom: 'from-orange-700/40',
    gradientTo: 'to-amber-600/40',
  },
  {
    id: 'curiosity',
    label: 'curiosité',
    description: 'Envie d\'apprendre, explorer le monde',
    icon: '🔭',
    promptKey: 'fast_story_curiosity',
    section: 'renforcement',
    gradientFrom: 'from-cyan-700/40',
    gradientTo: 'to-blue-600/40',
  },
  {
    id: 'empathy',
    label: 'empathie',
    description: 'Bienveillance, comprendre les autres',
    icon: '🤝',
    promptKey: 'fast_story_empathy',
    section: 'renforcement',
    gradientFrom: 'from-pink-700/40',
    gradientTo: 'to-rose-600/40',
  },
  {
    id: 'pride',
    label: 'fierté',
    description: 'Sentiment d\'accomplissement, valorisation',
    icon: '🏆',
    promptKey: 'fast_story_pride',
    section: 'renforcement',
    gradientFrom: 'from-violet-700/40',
    gradientTo: 'to-purple-600/40',
  },
  {
    id: 'focus',
    label: 'concentration',
    description: 'Attention, ancrage et focalisation',
    icon: '🎯',
    promptKey: 'fast_story_focus_skill',
    section: 'renforcement',
    gradientFrom: 'from-blue-700/40',
    gradientTo: 'to-indigo-600/40',
  },
  {
    id: 'creativity',
    label: 'créativité',
    description: 'Imagination, expression libre',
    icon: '🎨',
    promptKey: 'fast_story_creativity',
    section: 'renforcement',
    gradientFrom: 'from-fuchsia-700/40',
    gradientTo: 'to-pink-600/40',
  },
  {
    id: 'autonomy',
    label: 'autonomie',
    description: 'Sécurité intérieure, indépendance',
    icon: '🌱',
    promptKey: 'fast_story_autonomy',
    section: 'renforcement',
    gradientFrom: 'from-lime-700/40',
    gradientTo: 'to-green-600/40',
  },
];

// ─── Section 3 : Situations ──────────────────────────────────────────────────
export const FAST_STORIES_SITUATIONS: FastStoryItem[] = [
  {
    id: 'situation_dark',
    label: 'peur du noir',
    description: 'Transformer l\'inquiétude du soir en douceur et sécurité pour s\'endormir sereinement.',
    icon: '🌙',
    promptKey: 'fast_story_situation_dark',
    section: 'situation',
    gradientFrom: 'from-indigo-900/40',
    gradientTo: 'to-slate-800/40',
  },
  {
    id: 'situation_confidence',
    label: 'confiance en soi',
    description: 'Aider l\'enfant à se percevoir de manière positive et à croire en ses capacités.',
    icon: '✨',
    promptKey: 'fast_story_situation_confidence',
    section: 'situation',
    gradientFrom: 'from-amber-800/40',
    gradientTo: 'to-yellow-600/40',
  },
  {
    id: 'situation_separation',
    label: 'anxiété de séparation',
    description: 'Apaiser la difficulté des séparations liées à l\'école, à un déménagement ou à des changements familiaux.',
    icon: '🏡',
    promptKey: 'fast_story_situation_separation',
    section: 'situation',
    gradientFrom: 'from-sky-800/40',
    gradientTo: 'to-blue-700/40',
  },
  {
    id: 'situation_grief',
    label: 'deuil et tristesse',
    description: 'Accompagner l\'enfant face à la perte d\'un proche, d\'un animal ou lors d\'un divorce.',
    icon: '🕊️',
    promptKey: 'fast_story_situation_grief',
    section: 'situation',
    gradientFrom: 'from-slate-800/40',
    gradientTo: 'to-zinc-700/40',
  },
  {
    id: 'situation_anger',
    label: 'colère et impulsivité',
    description: 'Apprendre à réguler ses émotions fortes et transformer cette énergie de manière constructive.',
    icon: '🌊',
    promptKey: 'fast_story_situation_anger',
    section: 'situation',
    gradientFrom: 'from-rose-800/40',
    gradientTo: 'to-red-700/40',
  },
  {
    id: 'situation_stress',
    label: 'stress scolaire',
    description: 'Mieux gérer la pression des examens, la peur de l\'échec ou le trac.',
    icon: '📚',
    promptKey: 'fast_story_situation_stress',
    section: 'situation',
    gradientFrom: 'from-violet-800/40',
    gradientTo: 'to-purple-700/40',
  },
  {
    id: 'situation_bedwetting',
    label: 'énurésie',
    description: 'Travailler sur le contrôle inconscient des fonctions physiologiques la nuit.',
    icon: '💧',
    promptKey: 'fast_story_situation_bedwetting',
    section: 'situation',
    gradientFrom: 'from-cyan-800/40',
    gradientTo: 'to-teal-700/40',
  },
  {
    id: 'situation_medical',
    label: 'peur des soins',
    description: 'Réduire l\'appréhension et la douleur lors de soins médicaux (dentiste, vaccins, prises de sang).',
    icon: '🏥',
    promptKey: 'fast_story_situation_medical',
    section: 'situation',
    gradientFrom: 'from-green-800/40',
    gradientTo: 'to-emerald-700/40',
  },
  {
    id: 'situation_adhd',
    label: 'concentration et TDAH',
    description: 'Favoriser la focalisation sur une tâche et soutenir les capacités d\'apprentissage.',
    icon: '🧩',
    promptKey: 'fast_story_situation_adhd',
    section: 'situation',
    gradientFrom: 'from-orange-800/40',
    gradientTo: 'to-amber-700/40',
  },
  {
    id: 'situation_screens',
    label: 'addiction aux écrans',
    description: 'Modifier des comportements répétitifs comme le temps excessif devant les écrans ou sucer son pouce.',
    icon: '📵',
    promptKey: 'fast_story_situation_screens',
    section: 'situation',
    gradientFrom: 'from-fuchsia-800/40',
    gradientTo: 'to-pink-700/40',
  },
];

// ─── All fast stories combined ───────────────────────────────────────────────
export const ALL_FAST_STORIES: FastStoryItem[] = [
  ...FAST_STORIES_REGULATION,
  ...FAST_STORIES_RENFORCEMENT,
  ...FAST_STORIES_SITUATIONS,
];

// ─── Prompt keys for admin initialization ────────────────────────────────────
export const FAST_STORY_PROMPT_KEYS = ALL_FAST_STORIES.map(item => item.promptKey);

export const FAST_STORY_PROMPT_CONFIG: Record<string, { label: string; description: string; section: FastStorySection }> = Object.fromEntries(
  ALL_FAST_STORIES.map(item => [
    item.promptKey,
    {
      label: `⚡ Rapide — ${item.label}`,
      description: item.description,
      section: item.section,
    }
  ])
);
