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
