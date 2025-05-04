
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useStoryFormSubmission } from '@/hooks/stories/storyForm/useStoryFormSubmission';

// Mock dependencies
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe('useStoryFormSubmission', () => {
  const mockSetFormData = vi.fn();
  const mockSetIsSubmitting = vi.fn();
  const mockSetError = vi.fn();
  const mockOnSubmit = vi.fn();
  const mockOnStoryCreated = vi.fn();
  const mockValidateForm = vi.fn();
  
  // Mock user and session
  const mockUser = { id: 'user-123' };
  const mockSession = { user: mockUser };
  
  // Sample form data
  const sampleFormData = {
    childrenIds: ['child-1', 'child-2'],
    objective: 'sleep',
  };
  
  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
    
    // Setup default mock returns
    mockValidateForm.mockReturnValue({ isValid: true, error: null });
    mockOnSubmit.mockResolvedValue('story-123');
  });
  
  it('should successfully submit the form when validation passes', async () => {
    const { result } = renderHook(() => 
      useStoryFormSubmission(
        sampleFormData,
        mockSetFormData,
        false,
        mockSetIsSubmitting,
        null,
        mockSetError,
        mockUser,
        mockSession,
        mockOnSubmit,
        mockOnStoryCreated,
        mockValidateForm
      )
    );
    
    // Mock event
    const mockEvent = {
      preventDefault: vi.fn(),
    } as unknown as React.FormEvent;
    
    // Submit the form
    await act(async () => {
      await result.current.handleSubmit(mockEvent);
    });
    
    // Assertions
    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(mockValidateForm).toHaveBeenCalled();
    expect(mockSetIsSubmitting).toHaveBeenCalledWith(true);
    expect(mockOnSubmit).toHaveBeenCalledWith(sampleFormData);
    expect(mockOnStoryCreated).toHaveBeenCalledWith('story-123');
    expect(mockSetFormData).toHaveBeenCalled();
    expect(mockSetIsSubmitting).toHaveBeenCalledWith(false);
  });
  
  it('should handle validation failure correctly', async () => {
    // Setup validation to fail
    mockValidateForm.mockReturnValue({ 
      isValid: false, 
      error: 'Validation error' 
    });
    
    const { result } = renderHook(() => 
      useStoryFormSubmission(
        sampleFormData,
        mockSetFormData,
        false,
        mockSetIsSubmitting,
        null,
        mockSetError,
        mockUser,
        mockSession,
        mockOnSubmit,
        mockOnStoryCreated,
        mockValidateForm
      )
    );
    
    // Mock event
    const mockEvent = {
      preventDefault: vi.fn(),
    } as unknown as React.FormEvent;
    
    // Submit form and expect it to throw
    await act(async () => {
      try {
        await result.current.handleSubmit(mockEvent);
        // If we get here, the test failed
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
    
    // Assertions
    expect(mockValidateForm).toHaveBeenCalled();
    expect(mockSetError).toHaveBeenCalledWith('Validation error');
    expect(mockOnSubmit).not.toHaveBeenCalled();
    expect(mockSetIsSubmitting).toHaveBeenCalledWith(false);
  });
  
  it('should handle API errors correctly', async () => {
    // Setup onSubmit to throw an error
    mockOnSubmit.mockRejectedValue(new Error('API error'));
    
    const { result } = renderHook(() => 
      useStoryFormSubmission(
        sampleFormData,
        mockSetFormData,
        false,
        mockSetIsSubmitting,
        null,
        mockSetError,
        mockUser,
        mockSession,
        mockOnSubmit,
        mockOnStoryCreated,
        mockValidateForm
      )
    );
    
    // Mock event
    const mockEvent = {
      preventDefault: vi.fn(),
    } as unknown as React.FormEvent;
    
    // Submit form and expect it to throw
    await act(async () => {
      try {
        await result.current.handleSubmit(mockEvent);
        // If we get here, the test failed
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
    
    // Assertions
    expect(mockValidateForm).toHaveBeenCalled();
    expect(mockOnSubmit).toHaveBeenCalled();
    expect(mockOnStoryCreated).not.toHaveBeenCalled();
    expect(mockSetFormData).not.toHaveBeenCalled();
    expect(mockSetIsSubmitting).toHaveBeenCalledWith(false);
  });
  
  it('should ignore submission if already submitting', async () => {
    const { result } = renderHook(() => 
      useStoryFormSubmission(
        sampleFormData,
        mockSetFormData,
        true, // isSubmitting is true
        mockSetIsSubmitting,
        null,
        mockSetError,
        mockUser,
        mockSession,
        mockOnSubmit,
        mockOnStoryCreated,
        mockValidateForm
      )
    );
    
    // Mock event
    const mockEvent = {
      preventDefault: vi.fn(),
    } as unknown as React.FormEvent;
    
    // Submit the form
    await act(async () => {
      await result.current.handleSubmit(mockEvent);
    });
    
    // Should not proceed with submission
    expect(mockValidateForm).not.toHaveBeenCalled();
    expect(mockSetIsSubmitting).not.toHaveBeenCalled();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });
});
