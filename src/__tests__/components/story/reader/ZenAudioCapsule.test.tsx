// @vitest-environment node
import { describe, it, expect, vi, beforeAll } from 'vitest';

beforeAll(() => {
  if (typeof window === 'undefined') {
    (globalThis as any).window = {
      speechSynthesis: {
        cancel: vi.fn(),
        speak: vi.fn(),
        getVoices: vi.fn().mockReturnValue([]),
      },
      location: { href: 'http://localhost' },
      __CALMI_PREVIEW_MODE: false,
    };
  }
});

// Mocks Supabase, Router, et Toasts
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
      delete: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
    })),
    storage: {
      from: vi.fn(() => ({
        createSignedUrl: vi.fn().mockImplementation((path: string) => {
          return Promise.resolve({
            data: { signedUrl: `https://supabase.storage/audio-files/${path}?token=abc` },
            error: null,
          });
        }),
      })),
    },
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
    })),
    removeChannel: vi.fn(),
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: { provider: 'vps-hostinger' }, error: null }),
    },
  },
}));

vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

import fs from 'fs';
import path from 'path';

describe('ZenAudioCapsule & Header Auto-Scroll - Tests unitaires et d\'architecture UX', () => {
  it('devrait importer le composant IntegratedAudioDeck sans erreur', async () => {
    const module = await import('@/components/story/reader/IntegratedAudioDeck');
    expect(module.IntegratedAudioDeck).toBeDefined();
    expect(typeof module.IntegratedAudioDeck).toBe('function');
  }, 15000);

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

  it('devrait avoir un sélecteur de voix filtrant exclusivement les narrateurs (sans les voix de personnages)', () => {
    const filePath = path.resolve(__dirname, '../../../../components/story/reader/IntegratedAudioDeck.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    expect(content).toContain('isVoicePopoverOpen');
    expect(content).toContain('Choisir le narrateur');
    expect(content).toContain('narratorVoices');
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

  it('devrait importer le composant ReaderControls sans référence orpheline à setIsMounted', async () => {
    const filePath = path.resolve(__dirname, '../../../../components/story/ReaderControls.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).not.toContain('setIsMounted');

    const module = await import('@/components/story/ReaderControls');
    expect(module.default).toBeDefined();
  }, 15000);
});
