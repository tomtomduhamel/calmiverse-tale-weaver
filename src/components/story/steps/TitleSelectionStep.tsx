import React, { useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { usePersistedStoryCreation } from '@/hooks/stories/usePersistedStoryCreation';
import { useN8nTitleGeneration } from '@/hooks/stories/useN8nTitleGeneration';
import { useN8nStoryFromTitle } from '@/hooks/stories/useN8nStoryFromTitle';
import { useRealtimeStoryMonitor } from '@/hooks/stories/useRealtimeStoryMonitor';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import TitleSelector from '@/components/story/title/TitleSelector';
import type { Child } from '@/types/child';
import type { StoryDurationMinutes } from '@/types/story';

interface TitleSelectionStepProps {
  children: Child[];
  onStoryCreated: (storyId: string) => void;
}

const TitleSelectionStep: React.FC<TitleSelectionStepProps> = ({ children, onStoryCreated }) => {
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
  
  const { generateAdditionalTitles, isGeneratingTitles, canRegenerate } = useN8nTitleGeneration();
  const { createStoryFromTitle, isCreatingStory } = useN8nStoryFromTitle();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Utiliser le monitoring en temps réel
  const { startMonitoring } = useRealtimeStoryMonitor({
    onStoryCreated: story => {
      console.log('[TitleSelectionStep] Histoire détectée par Realtime:', story.id);
      onStoryCreated(story.id);
    },
    onTimeout: () => {
      console.log('[TitleSelectionStep] Timeout du monitoring, redirection vers bibliothèque');
      onStoryCreated('timeout');
    },
    timeoutMs: 120000 // 2 minutes
  });

  const selectedChildren = children.filter(child => selectedChildrenIds.includes(child.id));

  const objectives = [
    { value: 'sleep', label: 'Endormissement', icon: '🌙' },
    { value: 'focus', label: 'Concentration', icon: '🧠' },
    { value: 'relax', label: 'Relaxation', icon: '🌸' },
    { value: 'fun', label: 'Amusement', icon: '🎉' }
  ];

  const selectedObjectiveData = objectives.find(obj => obj.value === selectedObjective);

  // Regénérer 3 titres supplémentaires
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
      toast({
        title: "Erreur",
        description: "Impossible de regénérer les titres",
        variant: "destructive"
      });
    }
  }, [selectedObjective, selectedChildrenIds, children, generateAdditionalTitles, generatedTitles, updateGeneratedTitles, incrementRegeneration, toast]);

  const handleCreateStory = useCallback(async (titleToUse: string, durationMinutes: StoryDurationMinutes) => {
    if (!titleToUse) {
      toast({
        title: "Titre requis",
        description: "Veuillez sélectionner un titre",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const selectedChildrenForStory = children.filter(child => selectedChildrenIds.includes(child.id));
      const childrenNames = selectedChildrenForStory.map(child => child.name);
      
      console.log('[TitleSelectionStep] Création histoire avec titre:', titleToUse, 'durée:', durationMinutes, 'min');
      
      updateSelectedTitle(titleToUse);
      updateSelectedDuration(durationMinutes);
      updateCurrentStep('creating');

      // Démarrer le monitoring en temps réel AVANT de créer l'histoire
      const cleanupMonitoring = startMonitoring();

      // Créer l'histoire via n8n avec les données complètes des enfants et la durée
      await createStoryFromTitle({
        selectedTitle: titleToUse,
        objective: selectedObjective,
        childrenIds: selectedChildrenIds,
        childrenNames,
        childrenGenders: selectedChildrenForStory.map(child => child.gender),
        children: selectedChildrenForStory,
        durationMinutes,
      });

      toast({
        title: "Création lancée",
        description: "Votre histoire est en cours de génération"
      });
    } catch (error: any) {
      console.error('[TitleSelectionStep] Erreur création histoire:', error);
      updateCurrentStep('titles');
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer l'histoire",
        variant: "destructive"
      });
    }
  }, [selectedObjective, selectedChildrenIds, children, createStoryFromTitle, startMonitoring, updateSelectedTitle, updateSelectedDuration, updateCurrentStep, toast]);

  const handleBack = useCallback(() => {
    navigate('/create-story/step-2');
  }, [navigate]);

  // Helper function to get gender icon
  const getGenderIcon = (gender: string) => {
    switch (gender) {
      case 'boy': return '👦';
      case 'girl': return '👧';
      case 'pet': return '🐾';
      default: return '👤';
    }
  };

  // Si on est en train de créer l'histoire
  if (currentStep === 'creating') {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Indicateur de progression */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
            <span>Sélection des enfants</span>
            <span>Choix de l'objectif</span>
            <span>Sélection du titre</span>
            <span className="font-medium text-primary">Création</span>
          </div>
          <Progress value={100} className="h-2" />
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <div>
                <h3 className="text-lg font-semibold mb-2">Création de votre histoire en cours</h3>
                <p className="text-muted-foreground mb-4">
                  Titre sélectionné : <span className="font-medium">"{selectedTitle}"</span>
                </p>
                <div className="space-y-2 text-sm">
                  <p className="text-muted-foreground">Vous serez automatiquement redirigé vers votre histoire dès qu'elle sera prête</p>
                </div>
              </div>
              
              <Button variant="outline" onClick={handleBack} disabled={isCreatingStory}>
                Retour aux titres
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Indicateur de progression */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
          <span>Sélection des enfants</span>
          <span>Choix de l'objectif</span>
          <span className="font-medium text-primary">Sélection du titre</span>
          <span>Création</span>
        </div>
        <Progress value={75} className="h-2" />
      </div>

      {/* Résumé de la sélection */}
      <Card className="bg-muted/30">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex flex-wrap gap-4">
              <div>
                <h3 className="font-medium mb-2">Enfants :</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedChildren.map(child => (
                    <Badge key={child.id} variant="secondary" className="text-sm">
                      {getGenderIcon(child.gender)} {child.name}
                    </Badge>
                  ))}
                </div>
              </div>
              {selectedObjectiveData && (
                <div>
                  <h3 className="font-medium mb-2">Objectif :</h3>
                  <Badge variant="outline" className="text-sm">
                    {selectedObjectiveData.icon} {selectedObjectiveData.label}
                  </Badge>
                </div>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={handleBack}>
              Modifier
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* En-tête */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Choisissez votre titre préféré
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Sélectionnez le titre qui vous inspire le plus pour créer votre histoire personnalisée
        </p>
      </div>

      {/* Sélecteur de titres */}
      <TitleSelector
        titles={generatedTitles}
        onSelectTitle={handleCreateStory}
        onRegenerateTitles={canRegenerate ? handleRegenerateTitles : undefined}
        canRegenerate={canRegenerate}
        isCreatingStory={isCreatingStory}
        isRegenerating={isGeneratingTitles}
      />
      
      {/* Navigation */}
      <div className="flex justify-center">
        <Button variant="outline" onClick={handleBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour à l'objectif
        </Button>
      </div>
    </div>
  );
};

export default TitleSelectionStep;