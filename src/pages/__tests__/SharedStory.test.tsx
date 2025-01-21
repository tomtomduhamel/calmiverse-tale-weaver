import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import SharedStory from '../SharedStory';
import { doc, getDoc, collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Mock Firebase
vi.mock('@/lib/firebase', () => ({
  db: {},
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
  collection: vi.fn(),
  addDoc: vi.fn(),
}));

const mockStory = {
  id: 'test-story-id',
  title: 'Test Story',
  story_text: 'This is a test story',
  objective: 'Test objective',
  createdAt: new Date(),
  sharing: {
    publicAccess: {
      enabled: true,
      token: 'valid-token',
      expiresAt: new Date(Date.now() + 86400000), // tomorrow
    },
  },
};

describe('SharedStory', () => {
  beforeEach(() => {
    // Reset location search params
    window.history.pushState({}, '', '/?id=test-story-id&token=valid-token');
  });

  it('affiche le chargement initialement', () => {
    render(
      <BrowserRouter>
        <SharedStory />
      </BrowserRouter>
    );
    
    const loadingElement = screen.queryByText(/Chargement/i);
    expect(loadingElement).not.toBeNull();
  });

  it('affiche l\'histoire quand le token est valide', async () => {
    (getDoc as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      exists: () => true,
      data: () => mockStory,
    });

    render(
      <BrowserRouter>
        <SharedStory />
      </BrowserRouter>
    );

    await waitFor(() => {
      const titleElement = screen.queryByText('Test Story');
      const storyElement = screen.queryByText('This is a test story');
      expect(titleElement).not.toBeNull();
      expect(storyElement).not.toBeNull();
    });
  });

  it('affiche un message d\'erreur pour un token invalide', async () => {
    const expiredStory = {
      ...mockStory,
      sharing: {
        publicAccess: {
          enabled: true,
          token: 'invalid-token',
          expiresAt: new Date(Date.now() - 86400000), // yesterday
        },
      },
    };

    (getDoc as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      exists: () => true,
      data: () => expiredStory,
    });

    render(
      <BrowserRouter>
        <SharedStory />
      </BrowserRouter>
    );

    await waitFor(() => {
      const errorMessage = screen.queryByText(/Ce lien de partage a expiré ou n'est plus valide/i);
      expect(errorMessage).not.toBeNull();
    });
  });

  it('affiche une erreur pour une histoire inexistante', async () => {
    (getDoc as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      exists: () => false,
    });

    render(
      <BrowserRouter>
        <SharedStory />
      </BrowserRouter>
    );

    await waitFor(() => {
      const errorMessage = screen.queryByText(/Cette histoire n'existe pas/i);
      expect(errorMessage).not.toBeNull();
    });
  });
});