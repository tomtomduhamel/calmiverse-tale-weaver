import { useState, useEffect, useCallback } from 'react';
import type { GeneratedTitle } from '@/hooks/stories/useN8nTitleGeneration';
import type { StoryDurationMinutes } from '@/types/story';

interface PersistedStoryCreationState {
  currentStep: 'children' | 'objective' | 'titles' | 'creating';
  selectedChildrenIds: string[];
  selectedObjective: string;
  generatedTitles: GeneratedTitle[];
  selectedTitle: string;
  selectedDuration: StoryDurationMinutes | null;
  timestamp: number;
  regenerationUsed: number;
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
      if (stored) {
        const parsed = JSON.parse(stored);
        // Check if not expired
        if (Date.now() - parsed.timestamp < EXPIRATION_TIME) {
          return parsed;
        }
      }
    } catch (error) {
      console.warn('Failed to restore story creation state:', error);
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
      regenerationUsed: 0
    };
  });

  // Save to localStorage whenever state changes avec protection contre les boucles
  useEffect(() => {
    try {
      const stateToSave = {
        ...state,
        timestamp: Date.now()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
      console.log('[usePersistedStoryCreation] Session sauvegardée:', {
        step: state.currentStep,
        childrenCount: state.selectedChildrenIds.length,
        objective: state.selectedObjective,
        titlesCount: state.generatedTitles.length
      });
    } catch (error) {
      console.warn('Failed to save story creation state:', error);
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
    setState(prev => ({ ...prev, regenerationUsed: prev.regenerationUsed + 1 }));
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
      regenerationUsed: 0
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
    
    // Actions
    updateCurrentStep,
    updateSelectedChildren,
    updateSelectedObjective,
    updateGeneratedTitles,
    updateSelectedTitle,
    updateSelectedDuration,
    incrementRegeneration,
    clearPersistedState,
    hasPersistedSession,
    hasValidSession,
    refreshSession
  };
};