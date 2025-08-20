import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Sparkles, Users, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useN8nTitleGeneration } from '@/hooks/stories/useN8nTitleGeneration';
import { useN8nStoryFromTitle } from '@/hooks/stories/useN8nStoryFromTitle';
import { useRealtimeStoryMonitor } from '@/hooks/stories/useRealtimeStoryMonitor';
import { usePersistedStoryCreation } from '@/hooks/stories/usePersistedStoryCreation';
import TitleSelector from './TitleSelector';
import type { Child } from '@/types/child';
import type { GeneratedTitle } from '@/hooks/stories/useN8nTitleGeneration';
import type { StoryDurationMinutes } from '@/types/story';
interface TitleBasedStoryCreatorProps {
  children: Child[];
  onStoryCreated: (storyId: string) => void;
  preSelectedChildId?: string;
}
const TitleBasedStoryCreator: React.FC<TitleBasedStoryCreatorProps> = ({
  children,
  onStoryCreated,
  preSelectedChildId
}) => {
  // Use persisted state instead of local state
  const {
    currentStep,
    selectedChildrenIds,
    selectedObjective,
    generatedTitles,
    selectedTitle,
    selectedDuration,
    regenerationUsed,
    updateCurrentStep,
    updateSelectedChildren,
    updateSelectedObjective,
    updateGeneratedTitles,
    updateSelectedTitle,
    updateSelectedDuration,
    incrementRegeneration,
    clearPersistedState,
    hasPersistedSession
  } = usePersistedStoryCreation();
  const {
    toast
  } = useToast();
  const {
    generateTitles,
    generateAdditionalTitles,
    clearTitles,
    resetRegenerationState,
    isGeneratingTitles,
    canRegenerate
  } = useN8nTitleGeneration();
  const {
    createStoryFromTitle,
    isCreatingStory
  } = useN8nStoryFromTitle();

  // Utiliser le monitoring en temps réel
  const {
    isMonitoring,
    startMonitoring
  } = useRealtimeStoryMonitor({
    onStoryCreated: story => {
      console.log('[TitleBasedStoryCreator] Histoire détectée par Realtime:', story.id);
      // Redirection immédiate vers l'histoire créée
      onStoryCreated(story.id);
    },
    onTimeout: () => {
      console.log('[TitleBasedStoryCreator] Timeout du monitoring, redirection vers bibliothèque');
      onStoryCreated('timeout');
    },
    timeoutMs: 120000 // 2 minutes
  });
  const objectives = [{
    value: 'sleep',
    label: 'Endormissement',
    icon: '🌙',
    description: 'Histoire apaisante pour le coucher'
  }, {
    value: 'focus',
    label: 'Concentration',
    icon: '🧠',
    description: 'Histoire stimulante et éducative'
  }, {
    value: 'relax',
    label: 'Relaxation',
    icon: '🌸',
    description: 'Histoire douce pour se détendre'
  }, {
    value: 'fun',
    label: 'Amusement',
    icon: '🎉',
    description: 'Histoire joyeuse et divertissante'
  }];
  
  // Effect pour présélectionner un enfant si spécifié et pas déjà de session
  useEffect(() => {
    if (preSelectedChildId && children.length > 0 && !hasPersistedSession()) {
      const childExists = children.find(child => child.id === preSelectedChildId);
      if (childExists && !selectedChildrenIds.includes(preSelectedChildId)) {
        console.log('[TitleBasedStoryCreator] Présélection de l\'enfant:', childExists.name);
        updateSelectedChildren([preSelectedChildId]);
      }
    }
  }, [preSelectedChildId, children, hasPersistedSession, selectedChildrenIds, updateSelectedChildren]);

  const handleChildToggle = useCallback((childId: string) => {
    const newSelection = selectedChildrenIds.includes(childId) 
      ? selectedChildrenIds.filter(id => id !== childId)
      : [...selectedChildrenIds, childId];
    updateSelectedChildren(newSelection);
  }, [selectedChildrenIds, updateSelectedChildren]);

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
  const handleGenerateTitles = useCallback(async () => {
    if (selectedChildrenIds.length === 0) {
      toast({
        title: "Sélection requise",
        description: "Veuillez sélectionner au moins un enfant",
        variant: "destructive"
      });
      return;
    }
    try {
      const selectedChildren = children.filter(child => selectedChildrenIds.includes(child.id));
      const childrenNames = selectedChildren.map(child => child.name);
      console.log('[TitleBasedStoryCreator] Génération de titres pour:', childrenNames);
      const titles = await generateTitles({
        objective: selectedObjective,
        childrenIds: selectedChildrenIds,
        childrenNames,
        childrenGenders: selectedChildren.map(child => child.gender)
      });
      if (titles && titles.length > 0) {
        updateGeneratedTitles(titles);
        updateCurrentStep('titles');
        resetRegenerationState();
      }
    } catch (error: any) {
      console.error('[TitleBasedStoryCreator] Erreur génération titres:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de générer les titres",
        variant: "destructive"
      });
    }
  }, [selectedChildrenIds, selectedObjective, children, generateTitles, updateGeneratedTitles, updateCurrentStep, resetRegenerationState, toast]);
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
      console.log('[TitleBasedStoryCreator] Création histoire avec titre:', titleToUse, 'durée:', durationMinutes, 'min');
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
        children: selectedChildrenForStory, // Passer les données complètes des enfants
        durationMinutes,
      });

      // Toast unique pour la création
      toast({
        title: "Création lancée",
        description: "Votre histoire est en cours de génération"
      });
    } catch (error: any) {
      console.error('[TitleBasedStoryCreator] Erreur création histoire:', error);
      updateCurrentStep('titles');
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer l'histoire",
        variant: "destructive"
      });
    }
  }, [selectedObjective, selectedChildrenIds, children, createStoryFromTitle, startMonitoring, updateSelectedTitle, updateSelectedDuration, updateCurrentStep, toast]);
  const handleBack = useCallback(() => {
    if (currentStep === 'titles') {
      updateCurrentStep('objective');
      clearTitles();
    } else if (currentStep === 'creating') {
      updateCurrentStep('titles');
    }
  }, [currentStep, clearTitles, updateCurrentStep]);

  // Gestion de la recommencer
  const handleRestart = useCallback(() => {
    clearPersistedState();
    toast({
      title: "Session réinitialisée",
      description: "Vous pouvez recommencer la création d'histoire."
    });
  }, [clearPersistedState, toast]);
  const selectedChildren = children.filter(child => selectedChildrenIds.includes(child.id));
  const selectedObjectiveData = objectives.find(obj => obj.value === selectedObjective);

  // Étape 1: Configuration
  if (currentStep === 'children') {
    return <div className="space-y-6">
        {/* Notification de session récupérée */}
        {hasPersistedSession() && (
          <Alert className="mb-6">
            <RefreshCw className="h-4 w-4" />
            <AlertDescription>
              Une session de création d'histoire a été récupérée. 
              <Button variant="link" className="ml-2 p-0" onClick={handleRestart}>
                Recommencer
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Indicateur de progression */}
        <div className="mb-6">
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
          <span>Sélection enfants</span>
          <span>Choix objectif</span>
          <span>Sélection du titre</span>
          <span>Création</span>
        </div>
        <Progress 
          value={currentStep === 'children' ? 25 : currentStep === 'objective' ? 50 : currentStep === 'titles' ? 75 : 100} 
          className="h-2" 
        />
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Sélectionnez les enfants
            </CardTitle>
            <CardDescription>
              Choisissez pour qui vous souhaitez créer cette histoire
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {children.map(child => <div key={child.id} onClick={() => handleChildToggle(child.id)} className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedChildrenIds.includes(child.id) ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                  <div className="font-medium">{child.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {new Date().getFullYear() - new Date(child.birthDate).getFullYear()} ans
                  </div>
                </div>)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Objectif de l'histoire</CardTitle>
            <CardDescription>
              Quel est le but de cette histoire ?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {objectives.map(objective => <div key={objective.value} onClick={() => updateSelectedObjective(objective.value)} className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedObjective === objective.value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{objective.icon}</span>
                    <span className="font-medium">{objective.label}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {objective.description}
                  </div>
                </div>)}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between items-center">
          <div className="flex flex-wrap gap-2">
            {selectedChildren.map(child => <Badge key={child.id} variant="secondary">
                {child.name}
              </Badge>)}
            {selectedObjectiveData && <Badge variant="outline">
                {selectedObjectiveData.icon} {selectedObjectiveData.label}
              </Badge>}
          </div>
          
          <Button onClick={handleGenerateTitles} disabled={selectedChildrenIds.length === 0 || isGeneratingTitles} className="min-w-[200px]">
            {isGeneratingTitles ? <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Génération...
              </> : <>
                <Sparkles className="w-4 h-4 mr-2" />
                Générer les titres
              </>}
          </Button>
        </div>
      </div>;
  }

  // Étape 2: Sélection du titre
  if (currentStep === 'titles') {
    return (
      <div className="space-y-6">
        <TitleSelector
          titles={generatedTitles}
          onSelectTitle={handleCreateStory}
          onRegenerateTitles={canRegenerate ? handleRegenerateTitles : undefined}
          canRegenerate={canRegenerate}
          isCreatingStory={isCreatingStory}
          isRegenerating={isGeneratingTitles}
        />
        
        <div className="flex justify-center">
          <Button variant="outline" onClick={handleBack}>
            Retour à la configuration
          </Button>
        </div>
      </div>
    );
  }

  // Étape 3: Création en cours avec monitoring temps réel
  if (currentStep === 'creating') {
    return <div className="space-y-6">
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
                  {isMonitoring}
                </div>
              </div>
              
              <Button variant="outline" onClick={handleBack} disabled={isCreatingStory}>
                Retour aux titres
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>;
  }
  return null;
};
export default TitleBasedStoryCreator;