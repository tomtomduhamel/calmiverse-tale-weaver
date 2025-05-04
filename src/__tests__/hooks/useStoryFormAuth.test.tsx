
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useStoryFormAuth } from '@/hooks/useStoryFormAuth';
import { createMockUser } from '../helpers/test-utils';

// Mock dependencies
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

vi.mock('@/contexts/SupabaseAuthContext', () => ({
  useSupabaseAuth: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';

describe('useStoryFormAuth', () => {
  const mockSetError = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset the mock implementation with a proper User object
    (useSupabaseAuth as any).mockImplementation(() => ({
      user: createMockUser('user-123'),
      loading: false,
    }));
  });
  
  it('should return authenticated user when available', () => {
    const { result } = renderHook(() => useStoryFormAuth(mockSetError));
    
    expect(result.current.user).toBeDefined();
    expect(result.current.user.id).toBe('user-123');
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.authChecked).toBe(true);
    expect(mockSetError).toHaveBeenCalledWith(null);
  });
  
  it('should handle loading state', () => {
    (useSupabaseAuth as any).mockImplementation(() => ({
      user: null,
      loading: true,
    }));
    
    const { result } = renderHook(() => useStoryFormAuth(mockSetError));
    
    expect(result.current.authLoading).toBe(true);
    expect(result.current.authChecked).toBe(false);
    expect(mockSetError).not.toHaveBeenCalled();
  });
  
  it('should handle unauthenticated state', () => {
    (useSupabaseAuth as any).mockImplementation(() => ({
      user: null,
      loading: false,
    }));
    
    const { result } = renderHook(() => useStoryFormAuth(mockSetError));
    
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.authChecked).toBe(true);
    expect(mockSetError).toHaveBeenCalledWith('User not authenticated');
  });
});
