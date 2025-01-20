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
    expect(loadingElement).toBeTruthy();
  });

  it('affiche l\'histoire quand le token est valide', async () => {
    // Mock successful story fetch
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
      expect(screen.queryByText('Test Story')).toBeTruthy();
      expect(screen.queryByText('This is a test story')).toBeTruthy();
    });
  });

  it('affiche un message d\'erreur pour un token invalide', async () => {
    // Mock story with expired token
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
      expect(errorMessage).toBeTruthy();
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
      expect(errorMessage).toBeTruthy();
    });
  });
});