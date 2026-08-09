import { describe, it, expect } from 'vitest';
import { 
  DEFAULT_VOICE_CATEGORIES, 
  SLOTS_PER_SECTION,
  VoiceCategoryConfig 
} from '../../types/voices';
import { 
  detectCharacterCategoryAndName, 
  resolveSmartVoice, 
  parseStoryToAudioSegments,
  VoiceCatalogItem 
} from '../../utils/storyAudioParser';

describe('Studio des Voix & Attribution Intelligente', () => {

  describe('1. Configuration des Catégories de Voix & Typographie', () => {
    it('devrait contenir exactement 6 catégories natives par défaut', () => {
      expect(DEFAULT_VOICE_CATEGORIES).toHaveLength(6);
    });

    it('devrait définir 5 slots par section', () => {
      expect(SLOTS_PER_SECTION).toBe(5);
    });

    it('devrait respecter la typographie française en casse de phrase pour les titres', () => {
      const labels = DEFAULT_VOICE_CATEGORIES.map(c => c.label);
      expect(labels).toContain('Narrateurs et famille');
      expect(labels).toContain('Animaux terrestres');
      expect(labels).toContain('Animaux volants et célestes');
      expect(labels).toContain('Animaux marins et aquatiques');
      expect(labels).toContain('Enfants');
      expect(labels).toContain('Monstres et créatures magiques');

      // Vérifier qu'aucun label ne contient de majuscule abusive à chaque mot
      labels.forEach(label => {
        const words = label.split(' ');
        if (words.length > 1) {
          // Les mots suivants (sauf noms propres) ne doivent pas être en majuscule
          const secondWord = words[1];
          if (secondWord !== 'Garçon' && secondWord !== 'Fille') {
            expect(secondWord[0]).toBe(secondWord[0].toLowerCase());
          }
        }
      });
    });

    it('devrait fournir des rôles par défaut et un script 15s adapté pour chaque catégorie', () => {
      DEFAULT_VOICE_CATEGORIES.forEach((cat: VoiceCategoryConfig) => {
        expect(cat.id).toBeDefined();
        expect(cat.emoji).toBeDefined();
        expect(cat.defaultRoles.length).toBeGreaterThan(0);
        expect(cat.defaultTranscript.length).toBeGreaterThan(20);
      });
    });
  });

  describe('2. Détection Intelligente des Personnages et Catégories', () => {
    it('devrait détecter les monstres et créatures magiques', () => {
      const result1 = detectCharacterCategoryAndName("« Groaaar ! Venez jouer avec moi ! »", "Le gros monstre poilu apparut derrière l'arbre.");
      expect(result1.category).toBe('magical_creatures');
      expect(result1.detectedName).toBe('Monstre');

      const result2 = detectCharacterCategoryAndName("« Bip boup, système activé ! »", "Le robot scintillant avança d'un pas.");
      expect(result2.category).toBe('magical_creatures');
      expect(result2.detectedName).toBe('Robot');

      const result3 = detectCharacterCategoryAndName("« Prenez un peu de poudre d'étoile ! »", "La petite fée souriait.");
      expect(result3.category).toBe('magical_creatures');
      expect(result3.detectedName).toBe('Fée');
    });

    it('devrait détecter les animaux volants et célestes', () => {
      const result1 = detectCharacterCategoryAndName("« Hou hou, suivez la lumière des étoiles ! »", "La chouette perchée sur la branche.");
      expect(result1.category).toBe('animal_flying');
      expect(result1.detectedName).toBe('Chouette');

      const result2 = detectCharacterCategoryAndName("« Je vole plus haut que les nuages ! »", "Le petit oiseau déploya ses ailes.");
      expect(result2.category).toBe('animal_flying');
      expect(result2.detectedName).toBe('Oiseau');
    });

    it('devrait détecter les animaux marins et aquatiques', () => {
      const result1 = detectCharacterCategoryAndName("« Plongeons vers le récif de corail ! »", "Le dauphin sauta hors de l'eau.");
      expect(result1.category).toBe('animal_aquatic');
      expect(result1.detectedName).toBe('Dauphin');

      const result2 = detectCharacterCategoryAndName("« Le chant de l'océan est si doux ce soir. »", "La grande baleine bleue chantait.");
      expect(result2.category).toBe('animal_aquatic');
      expect(result2.detectedName).toBe('Baleine');
    });

    it('devrait détecter les animaux terrestres', () => {
      const result1 = detectCharacterCategoryAndName("« J'ai trouvé des mûres délicieuses ! »", "L'ourson brun s'assit dans l'herbe.");
      expect(result1.category).toBe('animal_land');
      expect(result1.detectedName).toBe('Ours');

      const result2 = detectCharacterCategoryAndName("« Suivez mes traces sans faire de bruit. »", "Le renard rusé marchait doucement.");
      expect(result2.category).toBe('animal_land');
      expect(result2.detectedName).toBe('Renard');

      const result3 = detectCharacterCategoryAndName("« Ouaf ! Viens courir avec moi ! »", "Le chien remuait la queue.");
      expect(result3.category).toBe('animal_land');
      expect(result3.detectedName).toBe('Chien');
    });

    it('devrait détecter les enfants et héros', () => {
      const result1 = detectCharacterCategoryAndName("« Regarde ce château magnifique ! »", "La petite fille marchait dans le pré.");
      expect(result1.category).toBe('children');
      expect(result1.detectedName).toBe('Petite Fille');

      const result2 = detectCharacterCategoryAndName("« Je suis prêt pour l'aventure ! »", "Le petit garçon attacha sa cape.");
      expect(result2.category).toBe('children');
      expect(result2.detectedName).toBe('Petit Garçon');
    });
  });

  describe('3. Résolution et Attribution Intelligente des Voix', () => {
    const mockVoices: VoiceCatalogItem[] = [
      {
        id: 'voice_papa_narrator',
        name: 'Voix de Papa',
        relation: 'Papa',
        category: 'narrator_family',
        signedUrl: 'https://storage.supabase/papa.wav'
      },
      {
        id: 'voice_ours_gaston',
        name: 'Voix de Ours Gaston',
        relation: 'Ours',
        category: 'animal_land',
        signedUrl: 'https://storage.supabase/ours.wav'
      },
      {
        id: 'voice_renard',
        name: 'Voix de Petit Renard',
        relation: 'Renard',
        category: 'animal_land',
        signedUrl: 'https://storage.supabase/renard.wav'
      },
      {
        id: 'voice_chouette',
        name: 'Voix de Chouette Hedwige',
        relation: 'Chouette',
        category: 'animal_flying',
        signedUrl: 'https://storage.supabase/chouette.wav'
      },
      {
        id: 'voice_monstre_gloups',
        name: 'Voix de Monstre Gloups',
        relation: 'Monstre',
        category: 'magical_creatures',
        signedUrl: 'https://storage.supabase/gloups.wav'
      }
    ];

    it('devrait faire une correspondance directe exacte par nom de personnage si disponible', () => {
      // Pour un ours dans animal_land, il doit choisir l'ours et non le renard
      const match = resolveSmartVoice('animal_land', 'Ours', mockVoices, mockVoices[0]);
      expect(match.voiceId).toBe('voice_ours_gaston');
      expect(match.voiceRefUrl).toBe('https://storage.supabase/ours.wav');
    });

    it('devrait choisir le renard si le personnage détecté est le renard', () => {
      const match = resolveSmartVoice('animal_land', 'Renard', mockVoices, mockVoices[0]);
      expect(match.voiceId).toBe('voice_renard');
      expect(match.voiceRefUrl).toBe('https://storage.supabase/renard.wav');
    });

    it('devrait attribuer la première voix de la catégorie si aucun nom précis ne correspond', () => {
      // Loup n'a pas de clone dédié, mais fait partie de animal_land -> prend la 1ère voix animal_land disponible
      const match = resolveSmartVoice('animal_land', 'Loup inconnu', mockVoices, mockVoices[0]);
      expect(match.voiceId).toBe('voice_ours_gaston');
    });

    it('devrait basculer (fallback) sur la voix du narrateur si aucune voix n\'est enregistrée pour cette catégorie', () => {
      // Animaux aquatiques n'a aucune voix dans mockVoices -> fallback sur Papa Narrateur
      const match = resolveSmartVoice('animal_aquatic', 'Dauphin', mockVoices, mockVoices[0]);
      expect(match.voiceId).toBe('voice_papa_narrator');
      expect(match.voiceRefUrl).toBe('https://storage.supabase/papa.wav');
    });
  });

  describe('4. Découpage Intégral d\'une Histoire Multi-Voix', () => {
    const mockVoices: VoiceCatalogItem[] = [
      {
        id: 'voice_maman',
        name: 'Voix de Maman',
        relation: 'Maman',
        category: 'narrator_family',
        signedUrl: 'https://storage.supabase/maman.wav'
      },
      {
        id: 'voice_chouette',
        name: 'Voix de Chouette',
        relation: 'Chouette',
        category: 'animal_flying',
        signedUrl: 'https://storage.supabase/chouette.wav'
      },
      {
        id: 'voice_ours',
        name: 'Voix de Ours',
        relation: 'Ours',
        category: 'animal_land',
        signedUrl: 'https://storage.supabase/ours.wav'
      },
      {
        id: 'voice_robot',
        name: 'Voix de Robot Bip',
        relation: 'Robot',
        category: 'magical_creatures',
        signedUrl: 'https://storage.supabase/robot.wav'
      }
    ];

    it('devrait segmenter et attribuer chaque voix proprement dans un conte complet', () => {
      const story = `La nuit tombait doucement sur le village enchanté de Calmi.

Barnabé la chouette ouvrit de grands yeux ronds : « Bienvenue les amis, le spectacle des étoiles commence ! »

Gaston l'ours grommela doucement en s'étirant : « J'ai préparé un lit de feuilles bien douillet. »

Soudain, un petit robot lumineux s'avança : « Bip boup ! Tous les voyants sont au vert pour dormir ! »

Tout le monde ferma les yeux pour passer une nuit paisible.`;

      const segments = parseStoryToAudioSegments(story, mockVoices, 'voice_maman');

      expect(segments.length).toBeGreaterThan(4);

      // 1. Narration d'ouverture -> Maman
      const opening = segments[0];
      expect(opening.speakerType).toBe('narrator');
      expect(opening.voiceId).toBe('voice_maman');
      expect(opening.text).toContain('La nuit tombait doucement');

      // 2. Dialogue Chouette -> Chouette
      const chouetteSegment = segments.find(s => s.text.includes('Bienvenue les amis'));
      expect(chouetteSegment).toBeDefined();
      expect(chouetteSegment?.speakerType).toBe('dialogue');
      expect(chouetteSegment?.voiceId).toBe('voice_chouette');
      expect(chouetteSegment?.roleCategory).toBe('animal_flying');

      // 3. Dialogue Ours -> Ours
      const oursSegment = segments.find(s => s.text.includes('lit de feuilles'));
      expect(oursSegment).toBeDefined();
      expect(oursSegment?.speakerType).toBe('dialogue');
      expect(oursSegment?.voiceId).toBe('voice_ours');
      expect(oursSegment?.roleCategory).toBe('animal_land');

      // 4. Dialogue Robot -> Robot (Monstres & Créatures magiques)
      const robotSegment = segments.find(s => s.text.includes('Bip boup'));
      expect(robotSegment).toBeDefined();
      expect(robotSegment?.speakerType).toBe('dialogue');
      expect(robotSegment?.voiceId).toBe('voice_robot');
      expect(robotSegment?.roleCategory).toBe('magical_creatures');

      // 5. Narration finale -> Maman
      const finalNarrator = segments[segments.length - 1];
      expect(finalNarrator.speakerType).toBe('narrator');
      expect(finalNarrator.voiceId).toBe('voice_maman');
      expect(finalNarrator.text).toContain('Tout le monde ferma les yeux');
    });
  });

});
