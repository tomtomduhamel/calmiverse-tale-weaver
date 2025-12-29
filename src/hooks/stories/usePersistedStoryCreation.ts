import { useState, useEffect, useCallback, useRef } from 'react';
import { safeStorage } from '@/utils/safeStorage';
import { usePageVisibility } from '@/hooks/usePageVisibility';
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
  isGeneratingTitles: boolean;
  generationInterrupted: boolean;
}

const STORAGE_KEY = 'calmiverse_story_creation';
const EXPIRATION_TIME = 60 * 60 * 1000; // 1 hour

const getDefaultState = (): PersistedStoryCreationState => ({
  currentStep: 'children',
  selectedChildrenIds: [],
  selectedObjective: '',
  generatedTitles: [],
  selectedTitle: '',
  selectedDuration: null,
  timestamp: Date.now(),
  regenerationUsed: false,
  titleGenerationCost: null,
  isGeneratingTitles: false,
  generationInterrupted: false
});

/**
 * Hook to persist story creation state across page refreshes and tab changes
 */
export const usePersistedStoryCreation = () => {
  const [state, setState] = useState<PersistedStoryCreationState>(() => {
    try {
      const stored = safeStorage.getItem(STORAGE_KEY);
      if (stored && stored.trim()) {
        const parsed = JSON.parse(stored);
        
        // Validation des données restaurées
        if (parsed && typeof parsed === 'object' && parsed.timestamp) {
          // Check if not expired
          if (Date.now() - parsed.timestamp < EXPIRATION_TIME) {
            console.log('[usePersistedStoryCreation] Session restaurée:', {
              step: parsed.currentStep,
              childrenCount: parsed.selectedChildrenIds?.length || 0,
              age: Math.round((Date.now() - parsed.timestamp) / 1000 / 60),
              wasGenerating: parsed.isGeneratingTitles
            });
            
            // Si génération était en cours, marquer comme interrompue
            const wasGenerating = Boolean(parsed.isGeneratingTitles);
            
            return {
              currentStep: parsed.currentStep || 'children',
              selectedChildrenIds: Array.isArray(parsed.selectedChildrenIds) ? parsed.selectedChildrenIds : [],
              selectedObjective: parsed.selectedObjective || '',
              generatedTitles: Array.isArray(parsed.generatedTitles) ? parsed.generatedTitles : [],
              selectedTitle: parsed.selectedTitle || '',
              selectedDuration: parsed.selectedDuration || null,
              timestamp: parsed.timestamp,
              regenerationUsed: Boolean(parsed.regenerationUsed),
              titleGenerationCost: parsed.titleGenerationCost || null,
              isGeneratingTitles: false, // Reset car on a quitté
              generationInterrupted: wasGenerating && (parsed.generatedTitles?.length || 0) === 0
            };
          } else {
            console.log('[usePersistedStoryCreation] Session expirée, nettoyage');
            safeStorage.removeItem(STORAGE_KEY);
          }
        }
      }
    } catch (error) {
      console.warn('[usePersistedStoryCreation] Erreur lors de la restauration:', error);
      safeStorage.removeItem(STORAGE_KEY);
    }
    
    return getDefaultState();
  });

  // Ref pour éviter les sauvegardes inutiles
  const lastSavedRef = useRef<string>('');

  // Forcer la sauvegarde immédiate
  const forceSave = useCallback(() => {
    const stateToSave = { ...state, timestamp: Date.now() };
    try {
      safeStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
      console.log('[usePersistedStoryCreation] Sauvegarde forcée');
    } catch (error) {
      console.warn('[usePersistedStoryCreation] Erreur sauvegarde forcée:', error);
    }
  }, [state]);

  // Sauvegarder quand la page devient invisible
  usePageVisibility({
    onHide: forceSave,
    onShow: () => {
      console.log('[usePersistedStoryCreation] Page visible - vérification session');
    }
  });

  // Save to localStorage whenever state changes
  useEffect(() => {
    const stateToSave = { ...state, timestamp: Date.now() };
    const serialized = JSON.stringify(stateToSave);
    
    // Éviter les sauvegardes identiques
    if (serialized === lastSavedRef.current) return;
    
    try {
      safeStorage.setItem(STORAGE_KEY, serialized);
      lastSavedRef.current = serialized;
      console.log('[usePersistedStoryCreation] Session sauvegardée:', {
        step: state.currentStep,
        childrenCount: state.selectedChildrenIds.length,
        objective: state.selectedObjective,
        titlesCount: state.generatedTitles.length,
        isGenerating: state.isGeneratingTitles
      });
    } catch (error) {
      console.warn('[usePersistedStoryCreation] Erreur lors de la sauvegarde:', error);
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
    setState(prev => ({ 
      ...prev, 
      generatedTitles: titles,
      generationInterrupted: false // Clear interrupted flag when titles arrive
    }));
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

  const setIsGeneratingTitles = useCallback((isGenerating: boolean) => {
    setState(prev => ({ ...prev, isGeneratingTitles: isGenerating }));
  }, []);

  const clearGenerationInterrupted = useCallback(() => {
    setState(prev => ({ ...prev, generationInterrupted: false }));
  }, []);

  // Clear persisted state
  const clearPersistedState = useCallback(() => {
    safeStorage.removeItem(STORAGE_KEY);
    lastSavedRef.current = '';
    setState(getDefaultState());
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
    
    return hasRequiredData && isNotExpired;
  }, [state]);

  // Force refresh session data
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
    isGeneratingTitlesPersisted: state.isGeneratingTitles,
    generationInterrupted: state.generationInterrupted,
    
    // Actions
    updateCurrentStep,
    updateSelectedChildren,
    updateSelectedObjective,
    updateGeneratedTitles,
    updateSelectedTitle,
    updateSelectedDuration,
    incrementRegeneration,
    updateTitleGenerationCost,
    setIsGeneratingTitles,
    clearGenerationInterrupted,
    clearPersistedState,
    hasPersistedSession,
    hasValidSession,
    refreshSession,
    forceSave
  };
};
