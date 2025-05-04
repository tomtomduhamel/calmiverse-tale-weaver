
import { vi, describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useStoryFormHandlers } from '@/hooks/stories/storyForm/useStoryFormHandlers';
import type { StoryFormData } from '@/components/story/StoryFormTypes';

describe('useStoryFormHandlers', () => {
  const mockSetFormData = vi.fn();
  const mockSetError = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup mock implementation for setFormData
    mockSetFormData.mockImplementation((callback) => {
      if (typeof callback === 'function') {
        return callback({ childrenIds: ['child-1'], objective: '' });
      }
      return callback;
    });
  });
  
  it('should toggle a child on/off correctly', () => {
    // Initial form data with one child already selected
    const formData: StoryFormData = {
      childrenIds: ['child-1'],
      objective: '',
    };
    
    const { result } = renderHook(() => 
      useStoryFormHandlers(formData, mockSetFormData, null, mockSetError)
    );
    
    // Toggle an already selected child (should remove it)
    act(() => {
      result.current.handleChildToggle('child-1');
    });
    
    expect(mockSetFormData).toHaveBeenCalled();
    
    // Toggle a new child (should add it)
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
    
    // Toggle a child
    act(() => {
      result.current.handleChildToggle('child-1');
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
    
    // Toggle a child
    act(() => {
      result.current.handleChildToggle('child-1');
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
    
    // Set objective
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
    
    // Set objective
    act(() => {
      result.current.setObjective('sleep');
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
    
    // Reset error
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
    
    // Toggle with null/undefined childId
    act(() => {
      // @ts-ignore: Testing invalid input
      result.current.handleChildToggle(null);
    });
    
    // It shouldn't throw an error or call setFormData
    expect(mockSetFormData).not.toHaveBeenCalled();
  });
});
