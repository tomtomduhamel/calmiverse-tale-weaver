import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import StoryForm from '../StoryForm';

const mockObjectives = [
  { id: '1', label: 'Objectif 1', value: 'objective1' },
  { id: '2', label: 'Objectif 2', value: 'objective2' },
];

// Mock des hooks
vi.mock('@/hooks/useStoryObjectives', () => ({
  useStoryObjectives: () => ({
    objectives: mockObjectives,
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

    const title = screen.getByText('Créer une histoire');
    expect(title).not.toBeNull();
  });

  it('affiche le bouton pour ajouter un enfant quand il n\'y a pas d\'enfants', () => {
    render(
      <BrowserRouter>
        <StoryForm {...defaultProps} />
      </BrowserRouter>
    );

    const addChildButton = screen.getByText('Créer un profil enfant');
    expect(addChildButton).not.toBeNull();
  });

  it('affiche la liste des objectifs', () => {
    render(
      <BrowserRouter>
        <StoryForm {...defaultProps} />
      </BrowserRouter>
    );

    const objectivesLabel = screen.getByText('Je souhaite créer un moment de lecture qui va...');
    expect(objectivesLabel).not.toBeNull();
  });

  it('affiche le bouton de génération d\'histoire', () => {
    render(
      <BrowserRouter>
        <StoryForm {...defaultProps} />
      </BrowserRouter>
    );

    const generateButton = screen.getByText('Générer l\'histoire');
    expect(generateButton).not.toBeNull();
  });
});