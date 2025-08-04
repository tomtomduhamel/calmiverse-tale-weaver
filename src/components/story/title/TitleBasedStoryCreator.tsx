import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Sparkles, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useN8nTitleGeneration } from '@/hooks/stories/useN8nTitleGeneration';
import { useN8nStoryFromTitle } from '@/hooks/stories/useN8nStoryFromTitle';
import { useRealtimeStoryMonitor } from '@/hooks/stories/useRealtimeStoryMonitor';
import TitleSelector from './TitleSelector';
import type { Child } from '@/types/child';
import type { GeneratedTitle } from '@/hooks/stories/useN8nTitleGeneration';
interface TitleBasedStoryCreatorProps {
  children: Child[];
  onStoryCreated: (storyId: string) => void;
}
const TitleBasedStoryCreator: React.FC<TitleBasedStoryCreatorProps> = ({
  children,
  onStoryCreated
}) => {
  const [selectedChildrenIds, setSelectedChildrenIds] = useState<string[]>([]);
  const [selectedObjective, setSelectedObjective] = useState<string>('fun');
  const [selectedTitle, setSelectedTitle] = useState<string>('');
  const [currentStep, setCurrentStep] = useState<'setup' | 'titles' | 'creating'>('setup');
  const [hasUsedRegeneration, setHasUsedRegeneration] = useState<boolean>(false);
  const {
    toast
  } = useToast();
  const {
    generateTitles,
    generateAdditionalTitles,
    clearTitles,
    resetRegenerationState,
    generatedTitles,
    isGeneratingTitles,
    regenerationUsed,
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
  const handleChildToggle = useCallback((childId: string) => {
    setSelectedChildrenIds(prev => prev.includes(childId) ? prev.filter(id => id !== childId) : [...prev, childId]);
  }, []);

  // Regénérer 3 titres supplémentaires
  const handleRegenerateTitles = useCallback(async () => {
    if (!selectedObjective || selectedChildrenIds.length === 0) return;
    try {
      const selectedChildrenForTitles = children.filter(child => selectedChildrenIds.includes(child.id));
      await generateAdditionalTitles({
        objective: selectedObjective,
        childrenIds: selectedChildrenIds,
        childrenNames: selectedChildrenForTitles.map(c => c.name),
        childrenGenders: selectedChildrenForTitles.map(c => c.gender)
      });
      setHasUsedRegeneration(true);
    } catch (error: any) {
      console.error("Erreur lors de la regénération:", error);
      toast({
        title: "Erreur",
        description: "Impossible de regénérer les titres",
        variant: "destructive"
      });
    }
  }, [selectedObjective, selectedChildrenIds, children, generateAdditionalTitles, toast]);
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
      setCurrentStep('titles');
      setHasUsedRegeneration(false); // Réinitialiser pour cette nouvelle session
      resetRegenerationState();

      // Toast unique pour confirmer la génération des titres
      toast({
        title: "Titres générés avec succès",
        description: `${titles.length} titre${titles.length > 1 ? 's' : ''} disponible${titles.length > 1 ? 's' : ''}`
      });
    } catch (error: any) {
      console.error('[TitleBasedStoryCreator] Erreur génération titres:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de générer les titres",
        variant: "destructive"
      });
    }
  }, [selectedChildrenIds, selectedObjective, children, generateTitles, toast]);
  const handleCreateStory = useCallback(async (titleToUse: string) => {
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
      console.log('[TitleBasedStoryCreator] Création histoire avec titre:', titleToUse);
      setSelectedTitle(titleToUse);
      setCurrentStep('creating');

      // Démarrer le monitoring en temps réel AVANT de créer l'histoire
      const cleanupMonitoring = startMonitoring();

      // Créer l'histoire via n8n
      await createStoryFromTitle({
        selectedTitle: titleToUse,
        objective: selectedObjective,
        childrenIds: selectedChildrenIds,
        childrenNames,
        childrenGenders: selectedChildrenForStory.map(child => child.gender)
      });

      // Toast unique pour la création
      toast({
        title: "Création lancée",
        description: "Votre histoire est en cours de génération"
      });
    } catch (error: any) {
      console.error('[TitleBasedStoryCreator] Erreur création histoire:', error);
      setCurrentStep('titles');
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer l'histoire",
        variant: "destructive"
      });
    }
  }, [selectedObjective, selectedChildrenIds, children, createStoryFromTitle, startMonitoring, toast]);
  const handleBack = useCallback(() => {
    if (currentStep === 'titles') {
      setCurrentStep('setup');
      clearTitles();
      setSelectedTitle('');
      setHasUsedRegeneration(false);
    } else if (currentStep === 'creating') {
      setCurrentStep('titles');
    }
  }, [currentStep, clearTitles]);
  const selectedChildren = children.filter(child => selectedChildrenIds.includes(child.id));
  const selectedObjectiveData = objectives.find(obj => obj.value === selectedObjective);

  // Étape 1: Configuration
  if (currentStep === 'setup') {
    return <div className="space-y-6">
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
              {objectives.map(objective => <div key={objective.value} onClick={() => setSelectedObjective(objective.value)} className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedObjective === objective.value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
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