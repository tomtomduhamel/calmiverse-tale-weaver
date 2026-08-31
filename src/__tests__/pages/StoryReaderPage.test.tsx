import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/__tests__/helpers/test-utils';
import StoryReaderPage from '@/pages/StoryReaderPage';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { Story } from '@/types/story';

const mockStory: Story = {
  id: '00000000-0000-0000-0000-000000000001',
  title: 'Le Voyage dans les Nuages',
  content: 'Il était une fois un petit oiseau qui volait au-dessus des nuages roses.',
  preview: 'Un petit oiseau vole au-dessus des nuages.',
  objective: 'sleep',
  childrenIds: ['child-1'],
  childrenNames: ['Leo'],
  createdAt: new Date('2026-01-01'),
  status: 'ready',
  story_summary: 'Histoire douce pour dormir.',
  tags: ['Douceur'],
  isFavorite: false,
  sound_id: null,
  video_path: null,
};

// Mock dependencies
const mockStoriesList: Story[] = [mockStory];
const mockUpdateStoryStatus = vi.fn().mockResolvedValue(true);
const mockFetchStories = vi.fn();

vi.mock('@/hooks/stories/useSupabaseStories', () => ({
  useSupabaseStories: () => ({
    stories: mockStoriesList,
    updateStoryStatus: mockUpdateStoryStatus,
    fetchStories: mockFetchStories,
    isLoading: false,
  }),
}));

vi.mock('@/hooks/useSupabaseChildren', () => ({
  useSupabaseChildren: () => ({
    children: [{ id: 'child-1', name: 'Leo' }],
    isLoading: false,
  }),
}));

vi.mock('@/hooks/stories/useStoryVideoGeneration', () => ({
  useStoryVideoGeneration: () => ({
    generateVideoForStory: vi.fn(),
    isGeneratingVideo: () => false,
  }),
}));

vi.mock('@/hooks/stories/useStoryFavorites', () => ({
  useStoryFavorites: () => ({
    toggleFavorite: vi.fn().mockResolvedValue(true),
    isUpdating: false,
  }),
}));

vi.mock('@/hooks/settings/useUserSettings', () => ({
  useUserSettings: () => ({
    userSettings: {
      readingPreferences: {
        playVideoIntro: false,
      },
    },
    updateUserSettings: vi.fn(),
  }),
}));

vi.mock('@/contexts/SupabaseAuthContext', () => ({
  useSupabaseAuth: () => ({
    user: { id: 'user-123', email: 'test@example.com' },
    session: {},
    loading: false,
  }),
}));

vi.mock('@/contexts/ReadingSpeedContext', () => ({
  useReadingSpeed: () => ({
    readingSpeed: 120,
    setReadingSpeed: vi.fn(),
  }),
  ReadingSpeedProvider: ({ children }: any) => children,
}));

vi.mock('@/services/offline/offlineStorageService', () => ({
  offlineStorageService: {
    getOfflineStory: vi.fn().mockResolvedValue(null),
    cacheStories: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
      })),
      insert: vi.fn().mockReturnValue(Promise.resolve({ error: null })),
    })),
  },
}));

describe('StoryReaderPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait charger et afficher l\'histoire depuis le cache par son ID', async () => {
    render(
      <MemoryRouter initialEntries={['/app/reader/00000000-0000-0000-0000-000000000001']}>
        <Routes>
          <Route path="/app/reader/:id" element={<StoryReaderPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Le Voyage dans les Nuages')).toBeInTheDocument();
      expect(screen.getByText('oiseau')).toBeInTheDocument();
    });
  });

  it('devrait afficher un écran d\'erreur si l\'ID est invalide ou vide', async () => {
    render(
      <MemoryRouter initialEntries={['/app/reader/%20']}>
        <Routes>
          <Route path="/app/reader/:id" element={<StoryReaderPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Lien invalide/i)).toBeInTheDocument();
    });
  });
});
