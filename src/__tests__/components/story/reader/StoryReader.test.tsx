import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/__tests__/helpers/test-utils';
import StoryReader from '@/components/StoryReader';
import type { Story } from '@/types/story';

const mockStory: Story = {
  id: 'story-1234-uuid',
  title: 'Le Petit Dragon et l\'Étoile Magique',
  content: 'Il était une fois un petit dragon qui rêvait d\'attraper une étoile dans le ciel nocturne.',
  preview: 'Un petit dragon rêve d\'attraper une étoile.',
  objective: 'sleep',
  childrenIds: ['child-1'],
  childrenNames: ['Alice'],
  createdAt: new Date('2026-01-01'),
  status: 'ready',
  story_summary: 'Résumé magique du petit dragon.',
  tags: ['Aventure', 'Sommeil'],
  isFavorite: false,
  sound_id: null,
  video_path: null,
};

vi.mock('@/hooks/settings/useUserSettings', () => ({
  useUserSettings: () => ({
    userSettings: {
      readingPreferences: {
        playVideoIntro: false,
        dimScreenOnAudioPlay: false,
        immersiveReadingMode: 'none',
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

vi.mock('@/hooks/subscription/useSubscription', () => ({
  useSubscription: () => ({
    tier: 'premium',
    limits: {
      audio_generations_per_month: 10,
      has_multivoice_audio: true,
    },
    hasActiveSubscription: true,
    isLoading: false,
  }),
}));

vi.mock('@/hooks/stories/useStoryDeletion', () => ({
  useStoryDeletion: () => ({
    deleteStory: vi.fn().mockResolvedValue(true),
    isDeleting: false,
  }),
}));

import { MemoryRouter } from 'react-router-dom';

describe('StoryReader Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait afficher correctement le titre et le contenu de l\'histoire', () => {
    render(
      <MemoryRouter>
        <StoryReader
          story={mockStory}
          childName="Alice"
        />
      </MemoryRouter>
    );

    // Titre de l'histoire
    expect(screen.getByText('Le Petit Dragon et l\'Étoile Magique')).toBeInTheDocument();
    
    // Contenu textuel (mots tokenisés dans des spans)
    expect(screen.getByText('dragon')).toBeInTheDocument();
    expect(screen.getByText('étoile')).toBeInTheDocument();
  });

  it('devrait afficher la vue vide si aucune histoire n\'est fournie', () => {
    const handleClose = vi.fn();
    render(
      <MemoryRouter>
        <StoryReader
          story={null}
          onClose={handleClose}
        />
      </MemoryRouter>
    );

    expect(screen.getByText(/Aucune histoire à afficher/i)).toBeInTheDocument();
    const retourBtn = screen.getByRole('button', { name: /Retour/i });
    fireEvent.click(retourBtn);
    expect(handleClose).toHaveBeenCalled();
  });

  it('devrait déclencher onMarkAsRead lors du clic sur le bouton Lu', async () => {
    const mockMarkAsRead = vi.fn().mockResolvedValue(true);
    render(
      <MemoryRouter>
        <StoryReader
          story={mockStory}
          onMarkAsRead={mockMarkAsRead}
        />
      </MemoryRouter>
    );

    const markAsReadBtns = screen.getAllByRole('button', { name: /marquer comme lu/i });
    expect(markAsReadBtns.length).toBeGreaterThan(0);
    fireEvent.click(markAsReadBtns[0]);

    await waitFor(() => {
      expect(mockMarkAsRead).toHaveBeenCalledWith('story-1234-uuid');
    });
  });

  it('devrait proposer l\'action de basculer les favoris', async () => {
    const mockToggleFavorite = vi.fn();
    render(
      <MemoryRouter>
        <StoryReader
          story={mockStory}
          onToggleFavorite={mockToggleFavorite}
        />
      </MemoryRouter>
    );

    const favoriteBtn = screen.getByRole('button', { name: /favori/i });
    expect(favoriteBtn).toBeInTheDocument();
    fireEvent.click(favoriteBtn);

    expect(mockToggleFavorite).toHaveBeenCalledWith('story-1234-uuid');
  });
});
