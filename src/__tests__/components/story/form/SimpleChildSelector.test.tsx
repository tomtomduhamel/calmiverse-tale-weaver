
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SimpleChildSelector from '@/components/story/form/SimpleChildSelector';
import type { Child } from '@/types/child';

const mockChildren: Child[] = [
  {
    id: 'child-1',
    name: 'Emma',
    birthDate: new Date('2018-01-01'),
    authorId: 'author-1',
  },
  {
    id: 'child-2',
    name: 'Noah',
    birthDate: new Date('2019-01-01'),
    authorId: 'author-1',
  }
];

describe('SimpleChildSelector', () => {
  it('renders correctly with children', () => {
    const mockOnChildSelect = vi.fn();
    const mockOnCreateClick = vi.fn();
    
    render(
      <SimpleChildSelector
        children={mockChildren}
        selectedChildrenIds={[]}
        onChildSelect={mockOnChildSelect}
        onCreateChildClick={mockOnCreateClick}
      />
    );
    
    expect(screen.getByText('Emma (6 ans)')).toBeInTheDocument();
    expect(screen.getByText('Noah (5 ans)')).toBeInTheDocument();
    expect(screen.getByText('Ajouter un autre enfant')).toBeInTheDocument();
  });
  
  it('indicates selected children correctly', () => {
    const mockOnChildSelect = vi.fn();
    const mockOnCreateClick = vi.fn();
    
    render(
      <SimpleChildSelector
        children={mockChildren}
        selectedChildrenIds={['child-1']}
        onChildSelect={mockOnChildSelect}
        onCreateChildClick={mockOnCreateClick}
      />
    );
    
    expect(screen.getByText('✓ Sélectionné')).toBeInTheDocument();
  });
  
  it('calls onChildSelect when clicking a child', () => {
    const mockOnChildSelect = vi.fn();
    const mockOnCreateClick = vi.fn();
    
    render(
      <SimpleChildSelector
        children={mockChildren}
        selectedChildrenIds={[]}
        onChildSelect={mockOnChildSelect}
        onCreateChildClick={mockOnCreateClick}
      />
    );
    
    fireEvent.click(screen.getByText('Emma (6 ans)'));
    expect(mockOnChildSelect).toHaveBeenCalledWith('child-1');
  });
  
  it('calls onCreateChildClick when clicking the create button', () => {
    const mockOnChildSelect = vi.fn();
    const mockOnCreateClick = vi.fn();
    
    render(
      <SimpleChildSelector
        children={mockChildren}
        selectedChildrenIds={[]}
        onChildSelect={mockOnChildSelect}
        onCreateChildClick={mockOnCreateClick}
      />
    );
    
    fireEvent.click(screen.getByText('Ajouter un autre enfant'));
    expect(mockOnCreateClick).toHaveBeenCalled();
  });
  
  it('shows error styling when hasError is true', () => {
    const mockOnChildSelect = vi.fn();
    const mockOnCreateClick = vi.fn();
    
    render(
      <SimpleChildSelector
        children={mockChildren}
        selectedChildrenIds={[]}
        onChildSelect={mockOnChildSelect}
        onCreateChildClick={mockOnCreateClick}
        hasError={true}
      />
    );
    
    expect(screen.getByText('*')).toBeInTheDocument();
  });
  
  it('shows different button text when no children', () => {
    const mockOnChildSelect = vi.fn();
    const mockOnCreateClick = vi.fn();
    
    render(
      <SimpleChildSelector
        children={[]}
        selectedChildrenIds={[]}
        onChildSelect={mockOnChildSelect}
        onCreateChildClick={mockOnCreateClick}
      />
    );
    
    expect(screen.getByText('Créer un profil enfant')).toBeInTheDocument();
  });
});
