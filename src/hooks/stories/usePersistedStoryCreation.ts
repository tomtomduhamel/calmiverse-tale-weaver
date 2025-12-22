import { useState, useEffect, useCallback } from 'react';
import type { GeneratedTitle, TitleCostData } from '@/hooks/stories/useN8nTitleGeneration';
import type { StoryDurationMinutes } from '@/types/story';

interface PersistedStoryCreationState {
  currentStep: 'children' | 'objective' | 'titles' | 'creating';
  selectedChildrenIds: string[];
  selectedObjective: string;
  generatedTitles: GeneratedTitle[];
  selectedTitle: string;
  selectedDuration: StoryDurationMinutes | null;
  timestamp: number;
  regenerationUsed: boolean;
  titleGenerationCost: TitleCostData | null;
}

const STORAGE_KEY = 'calmiverse_story_creation';
const EXPIRATION_TIME = 60 * 60 * 1000; // 1 hour

/**
 * Hook to persist story creation state across page refreshes and tab changes
 */
export const usePersistedStoryCreation = () => {
  const [state, setState] = useState<PersistedStoryCreationState>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && stored.trim()) {
        const parsed = JSON.parse(stored);
        
        // Validation des données restaurées
        if (parsed && typeof parsed === 'object' && parsed.timestamp) {
          // Check if not expired
          if (Date.now() - parsed.timestamp < EXPIRATION_TIME) {
            console.log('[usePersistedStoryCreation] Session restaurée:', {
              step: parsed.currentStep,
              childrenCount: parsed.selectedChildrenIds?.length || 0,
              age: Math.round((Date.now() - parsed.timestamp) / 1000 / 60) // minutes
            });
            
            return {
              currentStep: parsed.currentStep || 'children',
              selectedChildrenIds: Array.isArray(parsed.selectedChildrenIds) ? parsed.selectedChildrenIds : [],
              selectedObjective: parsed.selectedObjective || '',
              generatedTitles: Array.isArray(parsed.generatedTitles) ? parsed.generatedTitles : [],
              selectedTitle: parsed.selectedTitle || '',
              selectedDuration: parsed.selectedDuration || null,
              timestamp: parsed.timestamp,
              regenerationUsed: Boolean(parsed.regenerationUsed),
              titleGenerationCost: parsed.titleGenerationCost || null
            };
          } else {
            console.log('[usePersistedStoryCreation] Session expirée, nettoyage');
            localStorage.removeItem(STORAGE_KEY);
          }
        }
      }
    } catch (error) {
      console.warn('[usePersistedStoryCreation] Erreur lors de la restauration:', error);
      // Nettoyer les données corrompues
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (cleanupError) {
        console.warn('[usePersistedStoryCreation] Impossible de nettoyer localStorage:', cleanupError);
      }
    }
    
    // Return default state
    return {
      currentStep: 'children' as const,
      selectedChildrenIds: [],
      selectedObjective: '',
      generatedTitles: [],
      selectedTitle: '',
      selectedDuration: null,
      timestamp: Date.now(),
      regenerationUsed: false,
      titleGenerationCost: null
    };
  });

  // Save to localStorage whenever state changes avec protection contre les boucles
  useEffect(() => {
    try {
      const stateToSave = {
        ...state,
        timestamp: Date.now()
      };
      
      const serialized = JSON.stringify(stateToSave);
      if (serialized && typeof Storage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, serialized);
        console.log('[usePersistedStoryCreation] Session sauvegardée:', {
          step: state.currentStep,
          childrenCount: state.selectedChildrenIds.length,
          objective: state.selectedObjective,
          titlesCount: state.generatedTitles.length
        });
      }
    } catch (error) {
      console.warn('[usePersistedStoryCreation] Erreur lors de la sauvegarde:', error);
      // En cas d'erreur de stockage, continuer sans crasher
      if (error instanceof Error && error.message.includes('QuotaExceededError')) {
        console.warn('[usePersistedStoryCreation] Quota localStorage dépassé, nettoyage...');
        try {
          localStorage.clear();
        } catch (clearError) {
          console.warn('[usePersistedStoryCreation] Impossible de nettoyer localStorage:', clearError);
        }
      }
    }
  }, [state]);

  // Update functions
  const updateCurrentStep = useCallback((step: 'children' | 'objective' | 'titles' | 'creating') => {
    setState(prev => ({ ...prev, currentStep: step }));
  }, []);

  const updateSelectedChildren = useCallback((childrenIds: string[]) => {
    setState(prev => ({ ...prev, selectedChildrenIds: childrenIds }));
  }, []);

  const updateSelectedObjective = useCallback((objective: string) => {
    setState(prev => ({ ...prev, selectedObjective: objective }));
  }, []);

  const updateGeneratedTitles = useCallback((titles: GeneratedTitle[]) => {
    setState(prev => ({ ...prev, generatedTitles: titles }));
  }, []);

  const updateSelectedTitle = useCallback((title: string) => {
    setState(prev => ({ ...prev, selectedTitle: title }));
  }, []);

  const updateSelectedDuration = useCallback((duration: StoryDurationMinutes | null) => {
    setState(prev => ({ ...prev, selectedDuration: duration }));
  }, []);

  const incrementRegeneration = useCallback(() => {
    setState(prev => ({ ...prev, regenerationUsed: true }));
  }, []);

  const updateTitleGenerationCost = useCallback((cost: TitleCostData | null) => {
    setState(prev => ({ ...prev, titleGenerationCost: cost }));
  }, []);

  // Clear persisted state
  const clearPersistedState = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setState({
      currentStep: 'children',
      selectedChildrenIds: [],
      selectedObjective: '',
      generatedTitles: [],
      selectedTitle: '',
      selectedDuration: null,
      timestamp: Date.now(),
      regenerationUsed: false,
      titleGenerationCost: null
    });
  }, []);

  // Check if we have a persisted session
  const hasPersistedSession = useCallback(() => {
    return state.currentStep !== 'children' || 
           state.selectedChildrenIds.length > 0 || 
           state.selectedObjective !== '' ||
           state.generatedTitles.length > 0;
  }, [state]);

  // Validate session coherence
  const hasValidSession = useCallback(() => {
    const hasRequiredData = state.selectedChildrenIds.length > 0 && state.selectedObjective;
    const sessionAge = Date.now() - state.timestamp;
    const isNotExpired = sessionAge < EXPIRATION_TIME;
    
    console.log('[usePersistedStoryCreation] Validation session:', {
      hasRequiredData,
      sessionAge: Math.round(sessionAge / 1000 / 60), // minutes
      isNotExpired,
      currentStep: state.currentStep
    });
    
    return hasRequiredData && isNotExpired;
  }, [state]);

  // Force refresh session data (for debugging)
  const refreshSession = useCallback(() => {
    console.log('[usePersistedStoryCreation] Refresh forcé de la session');
    setState(prev => ({ ...prev, timestamp: Date.now() }));
  }, []);

  return {
    // State
    currentStep: state.currentStep,
    selectedChildrenIds: state.selectedChildrenIds,
    selectedObjective: state.selectedObjective,
    generatedTitles: state.generatedTitles,
    selectedTitle: state.selectedTitle,
    selectedDuration: state.selectedDuration,
    regenerationUsed: state.regenerationUsed,
    titleGenerationCost: state.titleGenerationCost,
    
    // Actions
    updateCurrentStep,
    updateSelectedChildren,
    updateSelectedObjective,
    updateGeneratedTitles,
    updateSelectedTitle,
    updateSelectedDuration,
    incrementRegeneration,
    updateTitleGenerationCost,
    clearPersistedState,
    hasPersistedSession,
    hasValidSession,
    refreshSession
  };
};