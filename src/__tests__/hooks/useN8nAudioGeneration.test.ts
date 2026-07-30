// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';

// Mocks Supabase et Toast
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
      delete: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
    })),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
    })),
    removeChannel: vi.fn(),
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: { webhookUrl: 'https://n8n.test' }, error: null }),
    },
  },
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe('Hook useN8nAudioGeneration - Valideur de Syntaxe et Structure', () => {
  it('devrait importer le hook useN8nAudioGeneration sans erreur de syntaxe', async () => {
    const module = await import('@/hooks/story/audio/useN8nAudioGeneration');
    expect(module.useN8nAudioGeneration).toBeDefined();
    expect(typeof module.useN8nAudioGeneration).toBe('function');
  });
});
