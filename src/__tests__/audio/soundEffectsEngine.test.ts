import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  soundEffectsEngine, 
  detectContextualSoundEffect, 
  stripStorySfxTags 
} from '@/utils/soundEffectsEngine';
import { stripStoryEmotionTags } from '@/utils/storyContentFormatter';

describe('Sound Effects Engine (SFX Féeriques Doux)', () => {
  beforeEach(() => {
    soundEffectsEngine.setEnabled(true);
  });

  describe('1. Détection contextuelle et balises explicites', () => {
    it('devrait détecter une balise explicite [sfx:stars]', () => {
      const effect = detectContextualSoundEffect('Le ciel s\'illumina de mille feux [sfx:stars] dans la nuit.');
      expect(effect).toBe('stars');
    });

    it('devrait détecter une balise explicite [sfx:owl]', () => {
      const effect = detectContextualSoundEffect('Tout était calme [sfx:owl] dans les bois.');
      expect(effect).toBe('owl');
    });

    it('devrait détecter sémantiquement les étoiles ou la poussière céleste', () => {
      const effect = detectContextualSoundEffect('Une merveilleuse étoile filante traversa le ciel étoilé.');
      expect(effect).toBe('stars');
    });

    it('devrait détecter sémantiquement la brise et le vent doux', () => {
      const effect = detectContextualSoundEffect('Une brise tiède caressait doucement les feuilles des arbres.');
      expect(effect).toBe('wind');
    });

    it('devrait détecter sémantiquement l\'eau et le ruisseau', () => {
      const effect = detectContextualSoundEffect('Le murmure apaisant du ruisseau chantait dans le sous-bois.');
      expect(effect).toBe('stream');
    });

    it('devrait détecter sémantiquement le hululement de la chouette', () => {
      const effect = detectContextualSoundEffect('La petite chouette veillait doucement sur le sommeil des enfants.');
      expect(effect).toBe('owl');
    });

    it('devrait retourner null si aucun bruitage contextuel n\'est approprié', () => {
      const effect = detectContextualSoundEffect('Le petit lapin marchait tranquillement sur le sentier.');
      expect(effect).toBeNull();
    });
  });

  describe('2. Nettoyage des balises pour la synthèse vocale et la lecture visuelle', () => {
    it('devrait nettoyer les balises [sfx:...] via stripStorySfxTags', () => {
      const input = 'Il regarda le ciel [sfx:stars] avec émerveillement.';
      expect(stripStorySfxTags(input)).toBe('Il regarda le ciel avec émerveillement.');
    });

    it('devrait nettoyer les balises [sfx:...] via stripStoryEmotionTags', () => {
      const input = 'Il s\'endormit [warm] sous la voûte céleste [sfx:magic].';
      expect(stripStoryEmotionTags(input)).toBe('Il s\'endormit sous la voûte céleste.');
    });
  });

  describe('3. Contrôle du moteur et cooldown', () => {
    it('devrait activer et désactiver le moteur proprement', () => {
      soundEffectsEngine.setEnabled(false);
      expect(soundEffectsEngine.getIsEnabled()).toBe(false);

      soundEffectsEngine.setEnabled(true);
      expect(soundEffectsEngine.getIsEnabled()).toBe(true);
    });
  });
});
