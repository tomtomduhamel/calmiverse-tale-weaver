import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import SharedStory from '../SharedStory';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import '@testing-library/jest-dom';

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

  it('renders loading state initially', () => {
    render(
      <BrowserRouter>
        <SharedStory />
      </BrowserRouter>
    );
    
    expect(screen.getByText(/Chargement/i)).toBeInTheDocument();
  });

  it('displays story when valid token is provided', async () => {
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
      expect(screen.getByText('Test Story')).toBeInTheDocument();
      expect(screen.getByText('This is a test story')).toBeInTheDocument();
    });
  });

  it('shows error message for invalid token', async () => {
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
      expect(screen.getByText(/Ce lien de partage a expiré ou n'est plus valide/i)).toBeInTheDocument();
    });
  });

  it('shows error for non-existent story', async () => {
    (getDoc as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      exists: () => false,
    });

    render(
      <BrowserRouter>
        <SharedStory />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Cette histoire n'existe pas/i)).toBeInTheDocument();
    });
  });
});