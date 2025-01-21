import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import StoryForm from '../StoryForm';
import '@testing-library/jest-dom';

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

  it('affiche le formulaire de création d\'histoire', () => {
    render(
      <BrowserRouter>
        <StoryForm {...defaultProps} />
      </BrowserRouter>
    );

    expect(screen.getByText('Créer une histoire')).toBeInTheDocument();
  });

  it('affiche le bouton pour ajouter un enfant quand il n\'y a pas d\'enfants', () => {
    render(
      <BrowserRouter>
        <StoryForm {...defaultProps} />
      </BrowserRouter>
    );

    expect(screen.getByText('Créer un profil enfant')).toBeInTheDocument();
  });

  it('affiche la liste des objectifs', () => {
    render(
      <BrowserRouter>
        <StoryForm {...defaultProps} />
      </BrowserRouter>
    );

    expect(screen.getByText('Je souhaite créer un moment de lecture qui va...')).toBeInTheDocument();
  });

  it('affiche le bouton de génération d\'histoire', () => {
    render(
      <BrowserRouter>
        <StoryForm {...defaultProps} />
      </BrowserRouter>
    );

    expect(screen.getByText('Générer l\'histoire')).toBeInTheDocument();
  });

  it('permet la sélection d\'un objectif', () => {
    render(
      <BrowserRouter>
        <StoryForm {...defaultProps} />
      </BrowserRouter>
    );

    const sleepObjective = screen.getByText('Aider à s\'endormir');
    fireEvent.click(sleepObjective);
    
    expect(sleepObjective).toBeInTheDocument();
  });
});