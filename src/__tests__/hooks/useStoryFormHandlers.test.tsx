
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useStoryFormHandlers } from '@/hooks/stories/storyForm/useStoryFormHandlers';
import type { StoryFormData } from '@/components/story/StoryFormTypes';

describe('useStoryFormHandlers', () => {
  const mockSetFormData = vi.fn();
  const mockSetError = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    
    // Configurer l'implémentation simulée pour setFormData
    mockSetFormData.mockImplementation((callback) => {
      if (typeof callback === 'function') {
        const prevData = { childrenIds: ['child-1'], objective: '' };
        return callback(prevData);
      }
      return callback;
    });
  });
  
  afterEach(() => {
    vi.useRealTimers();
  });
  
  it('should toggle a child on/off correctly', () => {
    // Données de formulaire initiales avec un enfant déjà sélectionné
    const formData: StoryFormData = {
      childrenIds: ['child-1'],
      objective: '',
    };
    
    const { result } = renderHook(() => 
      useStoryFormHandlers(formData, mockSetFormData, null, mockSetError)
    );
    
    // Désélectionner un enfant déjà sélectionné (devrait le supprimer)
    act(() => {
      result.current.handleChildToggle('child-1');
    });
    
    expect(mockSetFormData).toHaveBeenCalled();
    
    // Sélectionner un nouvel enfant (devrait l'ajouter)
    act(() => {
      result.current.handleChildToggle('child-2');
    });
    
    expect(mockSetFormData).toHaveBeenCalled();
  });
  
  it('should clear error when toggling a child with relevant error', () => {
    const formData: StoryFormData = {
      childrenIds: [],
      objective: '',
    };
    
    const error = "Veuillez sélectionner au moins un enfant";
    
    const { result } = renderHook(() => 
      useStoryFormHandlers(formData, mockSetFormData, error, mockSetError)
    );
    
    // Sélectionner un enfant
    act(() => {
      result.current.handleChildToggle('child-1');
      vi.runAllTimers(); // Exécuter tous les timers pour traiter le setTimeout
    });
    
    expect(mockSetError).toHaveBeenCalledWith(null);
  });
  
  it('should not clear error when toggling a child with unrelated error', () => {
    const formData: StoryFormData = {
      childrenIds: [],
      objective: '',
    };
    
    const error = "Une autre erreur";
    
    const { result } = renderHook(() => 
      useStoryFormHandlers(formData, mockSetFormData, error, mockSetError)
    );
    
    // Sélectionner un enfant
    act(() => {
      result.current.handleChildToggle('child-1');
      vi.runAllTimers(); // Exécuter tous les timers
    });
    
    expect(mockSetError).not.toHaveBeenCalled();
  });
  
  it('should set objective correctly', () => {
    const formData: StoryFormData = {
      childrenIds: ['child-1'],
      objective: '',
    };
    
    const { result } = renderHook(() => 
      useStoryFormHandlers(formData, mockSetFormData, null, mockSetError)
    );
    
    // Définir un objectif
    act(() => {
      result.current.setObjective('sleep');
    });
    
    expect(mockSetFormData).toHaveBeenCalled();
  });
  
  it('should clear error when setting objective with relevant error', () => {
    const formData: StoryFormData = {
      childrenIds: ['child-1'],
      objective: '',
    };
    
    const error = "Veuillez sélectionner un objectif";
    
    const { result } = renderHook(() => 
      useStoryFormHandlers(formData, mockSetFormData, error, mockSetError)
    );
    
    // Définir un objectif
    act(() => {
      result.current.setObjective('sleep');
      vi.runAllTimers(); // Exécuter tous les timers
    });
    
    expect(mockSetError).toHaveBeenCalledWith(null);
  });
  
  it('should reset error correctly', () => {
    const formData: StoryFormData = {
      childrenIds: ['child-1'],
      objective: 'sleep',
    };
    
    const error = "Une erreur quelconque";
    
    const { result } = renderHook(() => 
      useStoryFormHandlers(formData, mockSetFormData, error, mockSetError)
    );
    
    // Réinitialiser l'erreur
    act(() => {
      result.current.resetError();
    });
    
    expect(mockSetError).toHaveBeenCalledWith(null);
  });
  
  it('should handle invalid child IDs gracefully', () => {
    const formData: StoryFormData = {
      childrenIds: ['child-1'],
      objective: 'sleep',
    };
    
    const { result } = renderHook(() => 
      useStoryFormHandlers(formData, mockSetFormData, null, mockSetError)
    );
    
    // Essayer avec un childId null/undefined
    act(() => {
      // @ts-ignore: Test d'entrée invalide
      result.current.handleChildToggle(null);
    });
    
    expect(mockSetFormData).not.toHaveBeenCalled();
  });
});
