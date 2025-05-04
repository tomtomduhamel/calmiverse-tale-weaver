
import { vi, describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useNotifications } from '@/hooks/useNotifications';

// Mock dependencies
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe('useNotifications', () => {
  const mockSetError = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('should return notification functions', () => {
    const { result } = renderHook(() => useNotifications());
    
    expect(result.current.notifySuccess).toBeDefined();
    expect(result.current.notifyError).toBeDefined();
    expect(result.current.notifyInfo).toBeDefined();
    expect(result.current.notifyWarning).toBeDefined();
    expect(typeof result.current.notifySuccess).toBe('function');
  });
  
  it('should call toast with success parameters', () => {
    const { result } = renderHook(() => useNotifications());
    
    result.current.notifySuccess('Success message');
    
    // Check that toast was called with the right parameters
    expect(result.current.toast).toHaveBeenCalledWith({
      title: 'Success',
      description: 'Success message',
    });
  });
  
  it('should call toast and setError with error parameters', () => {
    const { result } = renderHook(() => useNotifications(mockSetError));
    
    result.current.notifyError('Error message');
    
    // Check that toast was called with the right parameters
    expect(result.current.toast).toHaveBeenCalledWith({
      title: 'Error',
      description: 'Error message',
      variant: 'destructive',
    });
    
    // Check that setError was called
    expect(mockSetError).toHaveBeenCalledWith('Error message');
  });
  
  it('should call toast with info parameters', () => {
    const { result } = renderHook(() => useNotifications());
    
    result.current.notifyInfo('Info message');
    
    // Check that toast was called with the right parameters
    expect(result.current.toast).toHaveBeenCalledWith({
      title: 'Information',
      description: 'Info message',
    });
  });
  
  it('should call toast with warning parameters', () => {
    const { result } = renderHook(() => useNotifications());
    
    result.current.notifyWarning('Warning message');
    
    // Check that toast was called with the right parameters
    expect(result.current.toast).toHaveBeenCalledWith({
      title: 'Warning',
      description: 'Warning message',
      variant: 'destructive',
      className: 'bg-amber-500 border-amber-600 text-white',
    });
  });
  
  it('should not call setError if not provided', () => {
    const { result } = renderHook(() => useNotifications()); // No setError provided
    
    result.current.notifyError('Error message');
    
    // Check that setError was not called
    expect(mockSetError).not.toHaveBeenCalled();
  });
});
