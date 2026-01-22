import React, { createContext, useContext, ReactNode, useCallback } from 'react';
import { usePersistedStoryCreation } from '@/hooks/stories/usePersistedStoryCreation';
import { useN8nTitleGeneration, GeneratedTitle, TitleCostData } from '@/hooks/stories/useN8nTitleGeneration';
import { TitleGenerationData } from '@/hooks/stories/useN8nTitleGeneration';
import type { CreationMode } from '@/types/chatbot';

// Define the shape of the context
interface TitleGenerationContextType {
    // From usePersistedStoryCreation
    creationMode: CreationMode;
    currentStep: 'children' | 'objective' | 'titles' | 'creating';
    selectedChildrenIds: string[];
    selectedObjective: string;
    generatedTitles: GeneratedTitle[];
    selectedTitle: string;
    selectedDuration: any;
    regenerationUsed: boolean;
    titleGenerationCost: TitleCostData | null;
    isGeneratingTitlesPersisted: boolean;
    generationInterrupted: boolean;

    // Actions from persistence
    updateCreationMode: (mode: any) => void;
    updateCurrentStep: (step: 'children' | 'objective' | 'titles' | 'creating') => void;
    updateSelectedChildren: (ids: string[]) => void;
    updateSelectedObjective: (obj: string) => void;
    updateGeneratedTitles: (titles: GeneratedTitle[]) => void;
    updateSelectedTitle: (title: string) => void;
    updateSelectedDuration: (duration: any) => void;
    incrementRegeneration: () => void;
    updateTitleGenerationCost: (cost: TitleCostData | null) => void;
    setIsGeneratingTitles: (isGenerating: boolean) => void;
    clearGenerationInterrupted: () => void;
    clearPersistedState: () => void;
    hasPersistedSession: () => boolean;
    hasValidSession: () => boolean;
    refreshSession: () => void;
    forceSave: () => void;

    // From useN8nTitleGeneration (logic execution)
    generateTitles: (data: TitleGenerationData) => Promise<GeneratedTitle[]>;
    generateAdditionalTitles: (data: TitleGenerationData) => Promise<GeneratedTitle[]>;
    clearTitles: () => void;
    isGeneratingTitles: boolean; // Active state
    canRegenerate: boolean;
}

const TitleGenerationContext = createContext<TitleGenerationContextType | undefined>(undefined);

export const TitleGenerationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // 1. Lift the persistence state to the global level
    const persistence = usePersistedStoryCreation();

    // 2. Lift the generation logic, connecting it to persistence
    const handleTitlesGenerated = useCallback((titles: GeneratedTitle[], costData?: TitleCostData) => {
        persistence.updateGeneratedTitles(titles);
        if (costData) {
            persistence.updateTitleGenerationCost(costData);
        }
    }, [persistence.updateGeneratedTitles, persistence.updateTitleGenerationCost]);

    const n8nGeneration = useN8nTitleGeneration(
        persistence.generatedTitles,
        handleTitlesGenerated,
        persistence.regenerationUsed,
        persistence.incrementRegeneration
    );

    // Combine everything into the context value
    const value: TitleGenerationContextType = {
        ...persistence,

        // N8N logic overrides/additions
        generateTitles: n8nGeneration.generateTitles,
        generateAdditionalTitles: n8nGeneration.generateAdditionalTitles,
        clearTitles: n8nGeneration.clearTitles,
        isGeneratingTitles: n8nGeneration.isGeneratingTitles, // Use real-time loading state
        canRegenerate: n8nGeneration.canRegenerate,
    };

    return (
        <TitleGenerationContext.Provider value={value}>
            {children}
        </TitleGenerationContext.Provider>
    );
};

export const useTitleGeneration = () => {
    const context = useContext(TitleGenerationContext);
    if (context === undefined) {
        throw new Error('useTitleGeneration must be used within a TitleGenerationProvider');
    }
    return context;
};
