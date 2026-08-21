import { describe, it, expect } from 'vitest';
import { stripStoryEmotionTags } from '@/utils/storyContentFormatter';
import { calculateReadingTime } from '@/utils/readingTime';
import { parseStoryToAudioSegments, EMOTION_INSTRUCT_MAP, detectEmotionAndInstruct } from '@/utils/storyAudioParser';

describe('Balisage Émotionnel Audio & Masquage Strict Côté Lecteur', () => {
  const sampleStoryWithTags = `[warm] Il était une fois, au cœur d'une forêt lumineuse, deux amis inséparables nommés Léo et Maya.

[excited] Soudain, Maya découvrit une petite porte dorée cachée dans le creux d'un vieux chêne !
« Regarde ça, c'est incroyable ! » s'écria Léo avec de grands yeux émerveillés.

[mysterious] En poussant la porte, un bruissement délicat se fit entendre dans la pénombre...
[whisper] « N'aie pas peur », chuchota la fée des sous-bois en apparaissant doucement.

[calm] Les enfants s'assirent dans l'herbe douce, apaisés par le chant de la rivière.

[sleepy] Leurs paupières devinrent agréablement lourdes, et la forêt tout entière s'endormit paisiblement.`;

  describe('Nettoyage strict pour l\'utilisateur (stripStoryEmotionTags)', () => {
    it('supprime toutes les balises d\'émotions standards ([warm], [whisper], [excited], etc.)', () => {
      const clean = stripStoryEmotionTags(sampleStoryWithTags);

      expect(clean).not.toContain('[warm]');
      expect(clean).not.toContain('[excited]');
      expect(clean).not.toContain('[mysterious]');
      expect(clean).not.toContain('[whisper]');
      expect(clean).not.toContain('[calm]');
      expect(clean).not.toContain('[sleepy]');

      // Vérifie que le texte narratif est intact
      expect(clean).toContain("Il était une fois, au cœur d'une forêt lumineuse");
      expect(clean).toContain("« Regarde ça, c'est incroyable ! » s'écria Léo");
      expect(clean).toContain("Leurs paupières devinrent agréablement lourdes");
    });

    it('supprime les balises libres du type [instruct: ...]', () => {
      const textWithCustomInstruct = "[instruct: Joyful, giggling voice] Les petits lutins commencèrent à danser en cercle.";
      const clean = stripStoryEmotionTags(textWithCustomInstruct);

      expect(clean).not.toContain('[instruct:');
      expect(clean).toBe('Les petits lutins commencèrent à danser en cercle.');
    });

    it('gère correctement les entrées nulles, indéfinies ou vides', () => {
      expect(stripStoryEmotionTags(null)).toBe('');
      expect(stripStoryEmotionTags(undefined)).toBe('');
      expect(stripStoryEmotionTags('')).toBe('');
    });
  });

  describe('Calcul du temps de lecture imperméable aux balises (calculateReadingTime)', () => {
    it('calcule un temps de lecture identique avec ou sans balises d\'émotions', () => {
      const cleanStory = stripStoryEmotionTags(sampleStoryWithTags);
      
      const timeWithTags = calculateReadingTime(sampleStoryWithTags);
      const timeWithoutTags = calculateReadingTime(cleanStory);

      expect(timeWithTags).toBe(timeWithoutTags);
    });
  });

  describe('Extraction des émotions pour la synthèse TTS (storyAudioParser)', () => {
    it('détecte correctement les balises explicites et associe l\'instruct en anglais pour Qwen3-TTS', () => {
      const res = detectEmotionAndInstruct('[excited] Youpi, c\'est parti !');
      expect(res.emotion).toBe('excited');
      expect(res.instruct).toBe(EMOTION_INSTRUCT_MAP.excited);
    });

    it('détecte les instructions personnalisées [instruct: ...]', () => {
      const res = detectEmotionAndInstruct('[instruct: Playful and energetic] Regardez le tour de magie !');
      expect(res.emotion).toBe('custom');
      expect(res.instruct).toBe('Playful and energetic');
    });

    it('applique des heuristiques intelligentes quand aucune balise n\'est présente', () => {
      const whisperRes = detectEmotionAndInstruct('« Viens par ici », chuchota le renard.');
      expect(whisperRes.emotion).toBe('whisper');

      const excitedRes = detectEmotionAndInstruct('« On a gagné ! » s\'écria le petit garçon.');
      expect(excitedRes.emotion).toBe('excited');

      const sleepyRes = detectEmotionAndInstruct('L\'ourson bâilla longuement avant de fermer les yeux.');
      expect(sleepyRes.emotion).toBe('sleepy');
    });

    it('découpe l\'histoire en segments audio avec textes 100% propres et consignes instruct', () => {
      const segments = parseStoryToAudioSegments(sampleStoryWithTags, [], 'narrator-main');

      expect(segments.length).toBeGreaterThan(0);

      // Vérifier qu'aucun segment ne contient de balise dans son text à synthétiser
      segments.forEach((seg) => {
        expect(seg.text).not.toMatch(/\[(warm|whisper|excited|mysterious|calm|sleepy|instruct:[^\]]+)\]/i);
        expect(seg.instruct).toBeDefined();
      });

      // Vérifier la présence d'instructs variés
      const instructs = segments.map(s => s.instruct);
      expect(instructs.some(i => i?.includes('Enthusiastic') || i?.includes('cheerful'))).toBe(true);
      expect(instructs.some(i => i?.includes('whisper'))).toBe(true);
    });
  });
});
