import React, { useCallback, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Loader2, RefreshCw } from 'lucide-react';
import { usePersistedStoryCreation } from '@/hooks/stories/usePersistedStoryCreation';
import { useN8nTitleGeneration } from '@/hooks/stories/useN8nTitleGeneration';
import { useN8nStoryFromTitle } from '@/hooks/stories/useN8nStoryFromTitle';
import { useRealtimeStoryMonitor } from '@/hooks/stories/useRealtimeStoryMonitor';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import TitleSelector from '@/components/story/title/TitleSelector';
import type { Child } from '@/types/child';
import type { StoryDurationMinutes } from '@/types/story';

interface MobileTitleSelectionStepProps {
  children: Child[];
  onStoryCreated: (storyId: string) => void;
}

const MobileTitleSelectionStep: React.FC<MobileTitleSelectionStepProps> = ({ 
  children, 
  onStoryCreated
}) => {
  // Appeler tous les hooks nécessaires
  const {
    currentStep,
    selectedChildrenIds,
    selectedObjective,
    generatedTitles,
    selectedTitle,
    updateCurrentStep,
    updateSelectedTitle,
    updateSelectedDuration,
    updateGeneratedTitles,
    incrementRegeneration
  } = usePersistedStoryCreation();
  
  const { generateTitles, generateAdditionalTitles, isGeneratingTitles, canRegenerate } = useN8nTitleGeneration(
    generatedTitles,
    updateGeneratedTitles
  );
  const { createStoryFromTitle, isCreatingStory } = useN8nStoryFromTitle();
  const { startMonitoring } = useRealtimeStoryMonitor({
    onStoryCreated: story => {
      console.log('[MobileTitleSelectionStep] Histoire détectée par Realtime:', story.id);
      onStoryCreated(story.id);
    },
    onTimeout: () => {
      console.log('[MobileTitleSelectionStep] Timeout du monitoring, redirection vers bibliothèque');
      onStoryCreated('timeout');
    },
    timeoutMs: 120000 // 2 minutes
  });
  
  const navigate = useNavigate();
  const { toast } = useToast();

  const selectedChildren = children.filter(child => selectedChildrenIds.includes(child.id));

  const objectives = [
    { value: 'sleep', label: 'Endormissement', icon: '🌙' },
    { value: 'focus', label: 'Concentration', icon: '🧠' },
    { value: 'relax', label: 'Relaxation', icon: '🌸' },
    { value: 'fun', label: 'Amusement', icon: '🎉' }
  ];

  const selectedObjectiveData = objectives.find(obj => obj.value === selectedObjective);

  // Auto-génération des titres si manquants
  useEffect(() => {
    if (
      selectedObjective && 
      selectedChildrenIds.length > 0 && 
      generatedTitles.length === 0 && 
      !isGeneratingTitles
    ) {
      const timer = setTimeout(() => {
        if (generatedTitles.length === 0 && !isGeneratingTitles) {
          handleAutoGenerateTitles();
        }
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [selectedObjective, selectedChildrenIds, generatedTitles.length, isGeneratingTitles]);

  // Vérification des prérequis
  useEffect(() => {
    if (!selectedObjective || selectedChildrenIds.length === 0) {
      if (selectedChildrenIds.length === 0) {
        navigate('/create-story/step-1');
      } else if (!selectedObjective) {
        navigate('/create-story/step-2');
      }
    }
  }, [selectedObjective, selectedChildrenIds, navigate]);

  const handleAutoGenerateTitles = useCallback(async () => {
    if (!selectedObjective || selectedChildrenIds.length === 0) return;
    
    try {
      const selectedChildrenForTitles = children.filter(child => selectedChildrenIds.includes(child.id));
      
      const newTitles = await generateTitles({
        objective: selectedObjective,
        childrenIds: selectedChildrenIds,
        childrenNames: selectedChildrenForTitles.map(c => c.name),
        childrenGenders: selectedChildrenForTitles.map(c => c.gender)
      });
      
      if (newTitles && newTitles.length > 0) {
        updateGeneratedTitles(newTitles);
      }
    } catch (error: any) {
      console.error("[MobileTitleSelectionStep] Erreur auto-génération:", error);
    }
  }, [selectedObjective, selectedChildrenIds, children, generateTitles, updateGeneratedTitles]);

  const handleRegenerateTitles = useCallback(async () => {
    if (!selectedObjective || selectedChildrenIds.length === 0) return;
    
    try {
      const selectedChildrenForTitles = children.filter(child => selectedChildrenIds.includes(child.id));
      const newTitles = await generateAdditionalTitles({
        objective: selectedObjective,
        childrenIds: selectedChildrenIds,
        childrenNames: selectedChildrenForTitles.map(c => c.name),
        childrenGenders: selectedChildrenForTitles.map(c => c.gender)
      });
      
      if (newTitles && newTitles.length > 0) {
        updateGeneratedTitles([...generatedTitles, ...newTitles]);
        incrementRegeneration();
      }
    } catch (error: any) {
      console.error("Erreur lors de la regénération:", error);
    }
  }, [selectedObjective, selectedChildrenIds, children, generateAdditionalTitles, generatedTitles, updateGeneratedTitles, incrementRegeneration]);

  const handleCreateStory = useCallback(async (titleToUse: string, durationMinutes: StoryDurationMinutes) => {
    if (!titleToUse) return;
    
    try {
      const selectedChildrenForStory = children.filter(child => selectedChildrenIds.includes(child.id));
      const childrenNames = selectedChildrenForStory.map(child => child.name);
      
      updateSelectedTitle(titleToUse);
      updateSelectedDuration(durationMinutes);
      updateCurrentStep('creating');

      const cleanupMonitoring = startMonitoring();

      await createStoryFromTitle({
        selectedTitle: titleToUse,
        objective: selectedObjective,
        childrenIds: selectedChildrenIds,
        childrenNames,
        childrenGenders: selectedChildrenForStory.map(child => child.gender),
        children: selectedChildrenForStory,
        durationMinutes,
      });

    } catch (error: any) {
      console.error('[MobileTitleSelectionStep] Erreur création histoire:', error);
      updateCurrentStep('titles');
    }
  }, [selectedObjective, selectedChildrenIds, children, createStoryFromTitle, startMonitoring, updateSelectedTitle, updateSelectedDuration, updateCurrentStep]);

  const handleBack = useCallback(() => {
    navigate('/create-story/step-2');
  }, [navigate]);

  const getGenderIcon = (gender: string) => {
    switch (gender) {
      case 'boy': return '👦';
      case 'girl': return '👧';
      case 'pet': return '🐾';
      default: return '👤';
    }
  };

  // État de création en cours
  if (currentStep === 'creating') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        {/* Header minimaliste */}
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b px-4 py-3">
          <Progress value={100} className="h-1.5" />
        </div>

        {/* Contenu de création */}
        <div className="px-4 py-8">
          <div className="max-w-sm mx-auto">
            <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
              <CardContent className="pt-8 pb-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-foreground">
                      Création en cours
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {selectedTitle}
                    </p>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleBack} 
                    disabled={isCreatingStory}
                    className="mt-4"
                  >
                    <ArrowLeft className="w-3 h-3 mr-1" />
                    Retour
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header compact */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleBack}
              className="h-8 w-8 p-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <Progress value={75} className="h-1.5" />
      </div>

      {/* Résumé compact */}
      <div className="px-4 py-4 border-b bg-white/60 dark:bg-gray-900/60">
        <div className="flex items-center justify-center gap-4 text-sm">
          <div className="flex gap-1">
            {selectedChildren.map(child => (
              <Badge key={child.id} variant="secondary" className="text-xs h-6">
                {getGenderIcon(child.gender)} {child.name}
              </Badge>
            ))}
          </div>
          {selectedObjectiveData && (
            <Badge variant="outline" className="text-xs h-6">
              {selectedObjectiveData.icon} {selectedObjectiveData.label}
            </Badge>
          )}
        </div>
      </div>

      {/* État de génération des titres */}
      {isGeneratingTitles && generatedTitles.length === 0 && (
        <div className="px-4 py-8">
          <div className="max-w-sm mx-auto">
            <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
              <CardContent className="pt-8 pb-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-foreground">
                      Génération en cours
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Création de titres pour {selectedChildren.map(c => c.name).join(', ')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Sélecteur de titres */}
      {generatedTitles.length > 0 && (
        <div className="px-4 py-6">
          <TitleSelector
            titles={generatedTitles}
            onSelectTitle={handleCreateStory}
            onRegenerateTitles={canRegenerate ? handleRegenerateTitles : undefined}
            canRegenerate={canRegenerate}
            isCreatingStory={isCreatingStory}
            isRegenerating={isGeneratingTitles}
          />
        </div>
      )}
    </div>
  );
};

export default MobileTitleSelectionStep;