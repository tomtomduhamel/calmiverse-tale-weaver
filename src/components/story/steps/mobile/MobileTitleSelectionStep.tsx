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
      <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        {/* Header avec barre de progression */}
        <div className="flex-none bg-white dark:bg-gray-900 border-b px-4 py-4">
          <div className="flex items-center gap-3 mb-3">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleBack}
              disabled={isCreatingStory}
              className="h-8 w-8 p-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="text-sm font-medium text-muted-foreground">Étape 4 sur 4</div>
          </div>
          <Progress value={100} className="h-2" />
        </div>

        {/* Résumé de sélection */}
        <div className="flex-none px-4 py-4 bg-muted/30 border-b">
          <div className="flex flex-wrap gap-2 justify-center">
            {selectedChildren.map(child => (
              <Badge key={child.id} variant="secondary" className="text-xs px-2 py-1">
                {getGenderIcon(child.gender)} {child.name}
              </Badge>
            ))}
            {selectedObjectiveData && (
              <Badge variant="outline" className="text-xs px-2 py-1">
                {selectedObjectiveData.icon} {selectedObjectiveData.label}
              </Badge>
            )}
          </div>
        </div>

        {/* Contenu de création - optimisé mobile */}
        <div className="flex-1 flex flex-col px-4 pt-6">
          {/* Textes de génération - positionnés en haut */}
          <div className="text-center space-y-2 mb-8">
            <h3 className="text-lg font-semibold text-foreground">
              Génération en cours
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Création de l'histoire pour {selectedChildren.map(c => c.name).join(', ')}
            </p>
          </div>
          
          {/* Spinner centré */}
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header avec navigation et progression */}
      <div className="flex-none bg-white dark:bg-gray-900 border-b px-4 py-4">
        <div className="flex items-center gap-3 mb-3">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleBack}
            className="h-8 w-8 p-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="text-sm font-medium text-muted-foreground">Étape 3 sur 4</div>
        </div>
        <Progress value={75} className="h-2" />
      </div>

      {/* Résumé de sélection */}
      <div className="flex-none px-4 py-4 bg-muted/30 border-b">
        <div className="flex flex-wrap gap-2 justify-center">
          {selectedChildren.map(child => (
            <Badge key={child.id} variant="secondary" className="text-xs px-2 py-1">
              {getGenderIcon(child.gender)} {child.name}
            </Badge>
          ))}
          {selectedObjectiveData && (
            <Badge variant="outline" className="text-xs px-2 py-1">
              {selectedObjectiveData.icon} {selectedObjectiveData.label}
            </Badge>
          )}
        </div>
      </div>

      {/* Contenu principal scrollable */}
      <div className="flex-1 overflow-y-auto">
        {/* État de génération des titres - optimisé mobile */}
        {isGeneratingTitles && generatedTitles.length === 0 && (
          <div className="px-4 pt-6">
            {/* Textes de génération - positionnés en haut */}
            <div className="text-center space-y-2 mb-8">
              <h3 className="text-lg font-semibold text-foreground">
                Génération en cours
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Création de titres pour {selectedChildren.map(c => c.name).join(', ')}
              </p>
            </div>
            
            {/* Spinner centré */}
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
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

        {/* Bouton de génération manuelle si aucun titre */}
        {generatedTitles.length === 0 && !isGeneratingTitles && selectedObjective && selectedChildrenIds.length > 0 && (
          <div className="flex items-center justify-center min-h-full px-4">
            <Card className="w-full max-w-sm">
              <CardContent className="pt-8 pb-6">
                <div className="flex flex-col items-center text-center space-y-6">
                  <RefreshCw className="h-12 w-12 text-muted-foreground" />
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold">Génération des titres</h3>
                    <p className="text-sm text-muted-foreground px-2">
                      Les titres n'ont pas pu être générés automatiquement.
                    </p>
                    <Button 
                      onClick={handleAutoGenerateTitles} 
                      disabled={isGeneratingTitles}
                      className="w-full"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Générer les titres
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileTitleSelectionStep;