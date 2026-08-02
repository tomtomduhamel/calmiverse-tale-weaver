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
    };
  }
});

import { getSignedAudioUrl } from '@/utils/storageUtils';

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

describe('IntegratedAudioDeck - Tests unitaires et d\'accès audio', () => {
  it('devrait importer le composant IntegratedAudioDeck sans erreur', async () => {
    const module = await import('@/components/story/reader/IntegratedAudioDeck');
    expect(module.IntegratedAudioDeck).toBeDefined();
    expect(typeof module.IntegratedAudioDeck).toBe('function');
  });

  describe('Utilitaire getSignedAudioUrl', () => {
    it('devrait retourner null si audioPath est null ou vide', async () => {
      const urlNull = await getSignedAudioUrl(null);
      expect(urlNull).toBeNull();

      const urlEmpty = await getSignedAudioUrl('');
      expect(urlEmpty).toBeNull();
    });

    it('devrait conserver les URLs complètes HTTP/HTTPS telles quelles', async () => {
      const httpUrl = 'https://example.com/audio.mp3';
      const result = await getSignedAudioUrl(httpUrl);
      expect(result).toBe(httpUrl);
    });

    it('devrait nettoyer le préfixe audio-files/ et les slashs initiaux avant la création du signedUrl', async () => {
      const rawPath = 'audio-files/438c37c4-7f96-4461-8c6a/audio.wav';
      const result = await getSignedAudioUrl(rawPath);
      expect(result).toContain('438c37c4-7f96-4461-8c6a/audio.wav');
      expect(result).not.toContain('audio-files/audio-files/');
    });
  });
});
