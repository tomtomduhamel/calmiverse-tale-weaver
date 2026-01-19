import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTitleGeneration } from '@/contexts/TitleGenerationContext';

export const TitleGenerationIndicator: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { isGeneratingTitles, currentStep } = useTitleGeneration();

    // Only show if generating AND not on the creation page
    // We check path startsWith to cover /create-story/step-1 etc if needed, 
    // but logically title generation happens at specific steps.
    // The main "waiting room" is CreateStoryStep1 or CreateStoryTitles depending on routes.
    // Based on App.tsx, the routes are /create-story/step-1, /create-story/step-2.
    // We should show this if user navigated away from the creation flow.

    const isCreationPage = location.pathname.includes('/create-story');

    if (!isGeneratingTitles || isCreationPage) {
        return null;
    }

    return (
        <div className="fixed bottom-20 right-4 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
            <Button
                onClick={() => navigate('/create-story/step-1')} // Assuming step-1 is where titles are handled/displayed
                className="rounded-full shadow-lg gap-2 h-12 px-6 bg-primary text-primary-foreground hover:bg-primary/90"
            >
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="font-medium">Création en cours...</span>
            </Button>
        </div>
    );
};
