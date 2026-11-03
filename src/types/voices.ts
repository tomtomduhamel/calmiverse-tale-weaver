export type VoiceEmotionStyle = 'calm' | 'adventure' | 'joy';

export interface VoiceEmotionalSample {
  voice_ref_path: string;
  transcript: string;
  recorded_at?: string;
  duration_seconds?: number;
}

export interface UserVoice {
  id: string;
  user_id: string;
  name: string;
  voice_ref_path: string;
  transcript: string | null;
  relation: string;
  category: string;
  category_name?: string | null;
  avatar_url?: string | null;
  created_at: string;
  updated_at: string;
  emotional_samples?: Partial<Record<VoiceEmotionStyle, VoiceEmotionalSample>> | null;
}

export interface CustomVoiceCategory {
  id: string;
  user_id: string;
  slug: string;
  label: string;
  icon?: string | null;
  created_at: string;
}

export interface VoiceInvitation {
  id: string;
  user_id: string;
  relation_name: string;
  category?: string;
  token: string;
  is_used: boolean;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface VoiceCategoryConfig {
  id: string;
  label: string;
  icon: string; // Lucide icon identifier or emoji
  emoji: string;
  description: string;
  defaultRoles: string[];
  defaultTranscript: string;
}

export const SLOTS_PER_SECTION = 5;

// Native categories definitions with French sentence case typography
export const DEFAULT_VOICE_CATEGORIES: VoiceCategoryConfig[] = [
  {
    id: 'narrator_family',
    label: 'Narrateurs et famille',
    icon: 'BookOpen',
    emoji: '📖',
    description: 'Voix des parents, grands-parents et proches pour la narration principale.',
    defaultRoles: ['Maman', 'Papa', 'Mamie', 'Papy', 'Tonton', 'Tata'],
    defaultTranscript: "Mon petit trésor, installe-toi confortablement sous ta couette. Les étoiles brillent dans la nuit pour veiller sur tes rêves les plus doux. Écoute cette jolie histoire et laisse-toi bercer par ma voix..."
  },
  {
    id: 'animal_land',
    label: 'Animaux terrestres',
    icon: 'PawPrint',
    emoji: '🐻',
    description: 'Compagnons de la forêt, animaux de compagnie et de la savane.',
    defaultRoles: ['Ours doux', 'Renard rusé', 'Chien fidèle', 'Loup protecteur', 'Chat câlin', 'Lapin curieux'],
    defaultTranscript: "Bienvenue dans la forêt magique ! Je suis ton compagnon tout doux. Avec mes grosses pattes et mon pelage réconfortant, je suis là pour veiller sur ton sommeil en toute sécurité."
  },
  {
    id: 'animal_flying',
    label: 'Animaux volants et célestes',
    icon: 'Feather',
    emoji: '🦉',
    description: 'Oiseaux, chouettes, créatures des airs et petits dragons ailés.',
    defaultRoles: ['Chouette sage', 'Petit oiseau', 'Aigle royal', 'Dragon ailé', 'Papillon magique'],
    defaultTranscript: "Hou hou ! Je suis le gardien du ciel étoilé. Mes ailes déployées me permettent de voler tout là-haut au-dessus des nuages. Suis-moi dans les étoiles pour un voyage magique ce soir !"
  },
  {
    id: 'animal_aquatic',
    label: 'Animaux marins et aquatiques',
    icon: 'Waves',
    emoji: '🐬',
    description: 'Créatures des océans, dauphins, poissons et légendes marines.',
    defaultRoles: ['Dauphin joueur', 'Baleine géante', 'Tortue de mer', 'Poisson clown', 'Petite sirène'],
    defaultTranscript: "Plouf ! Je nage calmement dans les profondeurs bleues de l'océan enchanté. Écoute le chant des vagues et laisse-toi porter au fil de l'eau vers des rêves merveilleux..."
  },
  {
    id: 'children',
    label: 'Enfants',
    icon: 'Sparkles',
    emoji: '👦👧',
    description: 'Héros et héroïnes de nos contes, petits frères, petites sœurs.',
    defaultRoles: ['Petit garçon intrépide', 'Petite fille curieuse', 'Princesse rêveuse', 'Prince courageux', 'Bébé rieur'],
    defaultTranscript: "Coucou ! Avec mon doudou et mon super courage, rien ne me fait peur. Je ferme les yeux, j'écoute les fées chuchoter dans le vent et je m'apprête à vivre la plus belle des aventures !"
  },
  {
    id: 'magical_creatures',
    label: 'Monstres et créatures magiques',
    icon: 'Ghost',
    emoji: '👾',
    description: 'Monstres bienveillants, trolls rigolos, fées, lutins et robots sympathiques.',
    defaultRoles: ['Monstre gentil', 'Troll rigolo', 'Fée scintillante', 'Robot bienveillant', 'Géant timide', 'Lutin farceur'],
    defaultTranscript: "Bip boup ! Groaar tout doux ! Ne t'inquiète pas, je suis un monstre très gentil venu d'une lointaine planète magique pour te faire rire et t'accompagner au pays des merveilles !"
  }
];

export interface VoiceEmotionConfig {
  id: VoiceEmotionStyle;
  label: string;
  icon: string;
  emoji: string;
  tagline: string;
  promptDescription: string;
  matchingObjectives: string[];
  defaultTranscript: string;
}

export const VOICE_EMOTION_CONFIGS: Record<VoiceEmotionStyle, VoiceEmotionConfig> = {
  calm: {
    id: 'calm',
    label: 'Douceur & Coucher',
    icon: 'Moon',
    emoji: '🌙',
    tagline: 'Pour endormir, apaiser et rassurer',
    promptDescription: 'Parlez d\'une voix douce, posée, presque chuchotée et réconfortante.',
    matchingObjectives: ['sleep', 'sommeil', 'coucher', 'dodo', 'calme', 'detente', 'relaxation', 'repos', 'apaisement', 'nuit'],
    defaultTranscript: "Mon trésor, installe-toi confortablement sous ta couette. Les étoiles brillent pour toi dans le ciel de Calmi. Écoute cette jolie histoire, laisse-toi bercer par mes paroles et fais de beaux rêves paisibles..."
  },
  adventure: {
    id: 'adventure',
    label: 'Énergie & Aventure',
    icon: 'Compass',
    emoji: '⚡',
    tagline: 'Pour le courage, la curiosité et l\'action',
    promptDescription: 'Parlez avec dynamisme, enthousiasme et une voix claire et entraînante.',
    matchingObjectives: ['courage', 'autonomie', 'curiosite', 'action', 'defi', 'exploration', 'peur', 'confiance', 'decouverte', 'aventure'],
    defaultTranscript: "Regarde là-bas ! Le chemin secret s'illumine à travers la forêt enchantée. Prends ton courage et suis-moi : aujourd'hui, nous partons à l'aventure et rien ne pourra nous arrêter !"
  },
  joy: {
    id: 'joy',
    label: 'Joie & Rires',
    icon: 'Smile',
    emoji: '☀️',
    tagline: 'Pour les contes drôles, le partage et la fête',
    promptDescription: 'Parlez avec un grand sourire dans la voix, sur un ton chaleureux et complice.',
    matchingObjectives: ['fun', 'joie', 'humour', 'rire', 'fete', 'partage', 'amitie', 'famille', 'fête'],
    defaultTranscript: "Oh quelle journée formidable ! Tu as vu ce petit écureuil qui jongle avec les noisettes ? Allez viens, on va bien s'amuser, rire et partager de super moments ensemble !"
  }
};

export function detectStoryEmotion(objective?: string | null): VoiceEmotionStyle {
  if (!objective) return 'calm';
  const norm = objective.toLowerCase();
  
  for (const style of ['adventure', 'joy'] as const) {
    const config = VOICE_EMOTION_CONFIGS[style];
    if (config.matchingObjectives.some(kw => norm.includes(kw))) {
      return style;
    }
  }
  return 'calm';
}
