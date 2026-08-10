// @vitest-environment node
import { describe, it, expect, vi, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('ZenAudioCapsule & Header Auto-Scroll - Tests unitaires et d\'architecture UX', () => {
  it('devrait importer le composant IntegratedAudioDeck sans erreur', async () => {
    const module = await import('@/components/story/reader/IntegratedAudioDeck');
    expect(module.IntegratedAudioDeck).toBeDefined();
    expect(typeof module.IntegratedAudioDeck).toBe('function');
  });

  it('devrait contenir la fine barre de progression unifiée de 3px', () => {
    const filePath = path.resolve(__dirname, '../../../../components/story/reader/IntegratedAudioDeck.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    expect(content).toContain('progressBarRef');
    expect(content).toContain('handleProgressBarClick');
    expect(content).toContain('displayProgress');
  });

  it('devrait écouter le scroll du lecteur de texte pour la progression hybride', () => {
    const filePath = path.resolve(__dirname, '../../../../components/story/reader/IntegratedAudioDeck.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    expect(content).toContain('data-radix-scroll-area-viewport');
    expect(content).toContain('readingProgress');
    expect(content).toContain('setReadingProgress');
  });

  it('devrait proposer le bouton magique "Créer l\'audio" lorsque l\'audio n\'est pas encore généré', () => {
    const filePath = path.resolve(__dirname, '../../../../components/story/reader/IntegratedAudioDeck.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    expect(content).toContain("Créer l'audio");
    expect(content).toContain('Sparkles');
  });

  it('devrait avoir un sélecteur de voix compact avec Popover sans blabla', () => {
    const filePath = path.resolve(__dirname, '../../../../components/story/reader/IntegratedAudioDeck.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    expect(content).toContain('isVoicePopoverOpen');
    expect(content).toContain('Choisir le conteur');
  });

  it('devrait avoir supprimé les boutons flottants FloatingToggleButton et FloatingAutoScrollButton de StoryReader', () => {
    const filePath = path.resolve(__dirname, '../../../../components/StoryReader.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    expect(content).not.toContain('FloatingToggleButton');
    expect(content).not.toContain('FloatingAutoScrollButton');
  });

  it('devrait avoir le bouton de défilement automatique sublimé dans StoryReaderHeader', () => {
    const filePath = path.resolve(__dirname, '../../../../components/story/reader/StoryReaderHeader.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    expect(content).toContain('AutoScrollHeaderButton');
    expect(content).toContain('ScrollText');
    expect(content).toContain('Défilement');
  });
});
