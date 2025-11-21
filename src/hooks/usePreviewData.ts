import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { isPreviewMode } from '@/utils/mobileBootOptimizer';
import { MOCK_USER, MOCK_CHILDREN, MOCK_STORIES } from '@/utils/previewMockData';

/**
 * 🎭 HOOK DE DONNÉES HYBRIDES PREVIEW
 * Retourne les vraies données si l'utilisateur est authentifié,
 * sinon retourne les mock data en mode preview.
 */
export function usePreviewData() {
  const { user } = useSupabaseAuth();
  const previewMode = isPreviewMode();
  
  const isRealUser = !!user;
  const isUsingMockData = !user && previewMode;

  return {
    // User data
    user: user || (isUsingMockData ? MOCK_USER : null),
    
    // Flags
    isRealUser,
    isUsingMockData,
    previewMode,
    
    // Mock data accessors (pour utilisation directe si besoin)
    mockChildren: isUsingMockData ? MOCK_CHILDREN : [],
    mockStories: isUsingMockData ? MOCK_STORIES : [],
  };
}
