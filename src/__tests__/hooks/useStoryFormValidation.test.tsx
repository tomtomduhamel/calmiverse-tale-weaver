
import { vi, describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useStoryFormValidation } from '@/hooks/stories/storyForm/useStoryFormValidation';
import type { StoryFormData } from '@/components/story/StoryFormTypes';
import { createMockUser, createMockSession } from '../helpers/test-utils';

describe('useStoryFormValidation', () => {
  it('should validate form correctly with valid data', () => {
    // Valid form data
    const formData: StoryFormData = {
      childrenIds: ['child-1', 'child-2'],
      objective: 'sleep',
    };
    
    const mockUser = createMockUser();
    const mockSession = createMockSession(mockUser);
    
    const { result } = renderHook(() => 
      useStoryFormValidation(formData, mockUser, mockSession)
    );
    
    const validation = result.current.validateForm();
    expect(validation.isValid).toBe(true);
    expect(validation.error).toBeNull();
  });
  
  it('should fail validation when user is not authenticated', () => {
    // Valid form data but no user
    const formData: StoryFormData = {
      childrenIds: ['child-1', 'child-2'],
      objective: 'sleep',
    };
    
    const { result } = renderHook(() => 
      useStoryFormValidation(formData, null, null)
    );
    
    const validation = result.current.validateForm();
    expect(validation.isValid).toBe(false);
    expect(validation.error).toContain("connecté");
  });
  
  it('should fail validation when childrenIds is not an array', () => {
    // Invalid form data: childrenIds not an array
    const formData = {
      childrenIds: 'not-an-array',
      objective: 'sleep',
    } as unknown as StoryFormData;
    
    const mockUser = createMockUser();
    const mockSession = createMockSession(mockUser);
    
    const { result } = renderHook(() => 
      useStoryFormValidation(formData, mockUser, mockSession)
    );
    
    const validation = result.current.validateForm();
    expect(validation.isValid).toBe(false);
    expect(validation.error).toContain("sélectionner au moins un enfant");
  });
  
  it('should fail validation when childrenIds array is empty', () => {
    // Invalid form data: empty childrenIds array
    const formData: StoryFormData = {
      childrenIds: [],
      objective: 'sleep',
    };
    
    const mockUser = createMockUser();
    const mockSession = createMockSession(mockUser);
    
    const { result } = renderHook(() => 
      useStoryFormValidation(formData, mockUser, mockSession)
    );
    
    const validation = result.current.validateForm();
    expect(validation.isValid).toBe(false);
    expect(validation.error).toContain("sélectionner au moins un enfant");
  });
  
  it('should fail validation when objective is missing', () => {
    // Invalid form data: missing objective
    const formData: StoryFormData = {
      childrenIds: ['child-1'],
      objective: '',
    };
    
    const mockUser = createMockUser();
    const mockSession = createMockSession(mockUser);
    
    const { result } = renderHook(() => 
      useStoryFormValidation(formData, mockUser, mockSession)
    );
    
    const validation = result.current.validateForm();
    expect(validation.isValid).toBe(false);
    expect(validation.error).toContain("objectif");
  });
});
