import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import StoryForm from '../StoryForm';

// Mock des hooks
vi.mock('@/hooks/useStoryObjectives', () => ({
  useStoryObjectives: () => ({
    objectives: [
      { id: '1', label: 'Aider à s\'endormir', value: 'sleep' },
      { id: '2', label: 'Se concentrer', value: 'focus' },
      { id: '3', label: 'Se détendre', value: 'relax' },
      { id: '4', label: 'S\'amuser', value: 'fun' }
    ],
    isLoading: false,
  }),
}));

vi.mock('@/hooks/useStoryForm', () => ({
  useStoryForm: () => ({
    formData: { childrenIds: [], objective: '' },
    isLoading: false,
    handleChildToggle: vi.fn(),
    setObjective: vi.fn(),
    handleSubmit: vi.fn(),
  }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe('StoryForm', () => {
  const defaultProps = {
    onSubmit: vi.fn(),
    children: [],
    onCreateChild: vi.fn(),
    onStoryCreated: vi.fn(),
  };

  it('devrait afficher le formulaire de création d\'histoire', () => {
    render(
      <BrowserRouter>
        <StoryForm {...defaultProps} />
      </BrowserRouter>
    );

    expect(screen.getByText('Créer une histoire')).toBeDefined();
  });

  it('devrait afficher le bouton pour ajouter un enfant quand il n\'y a pas d\'enfants', () => {
    render(
      <BrowserRouter>
        <StoryForm {...defaultProps} />
      </BrowserRouter>
    );

    expect(screen.getByText('Créer un profil enfant')).toBeDefined();
  });

  it('devrait afficher la liste des objectifs', () => {
    render(
      <BrowserRouter>
        <StoryForm {...defaultProps} />
      </BrowserRouter>
    );

    expect(screen.getByText('Je souhaite créer un moment de lecture qui va...')).toBeDefined();
  });

  it('devrait afficher le bouton de génération d\'histoire', () => {
    render(
      <BrowserRouter>
        <StoryForm {...defaultProps} />
      </BrowserRouter>
    );

    expect(screen.getByText('Générer l\'histoire')).toBeDefined();
  });
});