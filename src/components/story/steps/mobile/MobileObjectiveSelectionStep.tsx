import React, { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { useTitleGeneration } from '@/contexts/TitleGenerationContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import type { Child } from '@/types/child';
import { cn } from '@/lib/utils';
import { useStoryGenerationManager } from '@/services/stories/StoryGenerationManager';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface MobileObjectiveSelectionStepProps {
  children: Child[];
}

const MobileObjectiveSelectionStep: React.FC<MobileObjectiveSelectionStepProps> = ({ children }) => {
  const {
    selectedChildrenIds,
    selectedObjective,
    updateSelectedObjective,
    updateCurrentStep,
    clearPersistedState
  } = useTitleGeneration();

  const navigate = useNavigate();
  const { toast } = useToast();
  const { generateStoryInBackground } = useStoryGenerationManager();

  const selectedChildren = children.filter(child => selectedChildrenIds.includes(child.id));

  const objectives = [
    { value: 'sleep', label: 'Endormissement', icon: '🌙', description: 'Histoire pour s\'endormir' },
    { value: 'focus', label: 'Concentration', icon: '🧠', description: 'Histoire stimulante et éducative' },
    { value: 'relax', label: 'Relaxation', icon: '🌸', description: 'Histoire douce pour se détendre' },
    { value: 'fun', label: 'Amusement', icon: '🎉', description: 'Histoire joyeuse et divertissante' }
  ];

  const handleObjectiveSelect = useCallback((objective: string) => {
    updateSelectedObjective(objective);
  }, [updateSelectedObjective]);

  const handleContinueToTitles = useCallback(async () => {
    if (!selectedObjective) {
      toast({
        title: "Objectif requis",
        description: "Veuillez sélectionner un objectif pour continuer",
        variant: "destructive"
      });
      return;
    }

    if (selectedChildrenIds.length === 0) {
      toast({
        title: "Enfant requis",
        description: "Veuillez d'abord sélectionner au moins un enfant",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('[MobileObjectiveSelectionStep] Navigation vers sélection de titres avec:', {
        childrenIds: selectedChildrenIds,
        objective: selectedObjective,
        currentStep: 'objective -> titles'
      });

      // S'assurer que les données sont bien sauvegardées avant navigation
      console.log('[MobileObjectiveSelectionStep] Sauvegarde des données avant navigation...');

      // Attendre un court délai pour s'assurer que la sauvegarde est terminée
      await new Promise(resolve => setTimeout(resolve, 50));

      // Mettre à jour l'étape actuelle vers 'titles' 
      updateCurrentStep('titles');

      // Attendre encore un peu pour la persistance
      await new Promise(resolve => setTimeout(resolve, 50));

      console.log('[MobileObjectiveSelectionStep] Navigation vers /create-story-titles');
      navigate('/create-story-titles');
    } catch (error) {
      console.error('[MobileObjectiveSelectionStep] Erreur navigation:', error);
      toast({
        title: "Erreur",
        description: "Impossible de continuer. Veuillez réessayer.",
        variant: "destructive"
      });
    }
  }, [selectedObjective, selectedChildrenIds, updateCurrentStep, navigate, toast]);

  const handleBack = useCallback(() => {
    navigate('/create-story/step-1');
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

  return (
    <div className="space-y-6 px-4 py-6">
      {/* Indicateur de progression - même style que Step 1 */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
          <span>Enfants</span>
          <span className="font-medium text-primary">Objectif</span>
          <span>Titre</span>
          <span>Création</span>
        </div>
        <Progress value={50} className="h-2" />
      </div>

      {/* En-tête mobile - même style que Step 1 */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Choisissez l'objectif
        </h1>
        <p className="text-muted-foreground text-sm">
          Quel type d'histoire souhaitez-vous créer ?
        </p>
      </div>

      {/* Navigation mobile sticky en haut - même style que Step 1 */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm py-3 -mx-4 px-4 flex gap-3 mb-3">
        <Button variant="outline" onClick={handleBack} className="flex-1">
          Retour
        </Button>
        <Button
          onClick={handleContinueToTitles}
          disabled={!selectedObjective}
          className="flex-1"
        >
          Continuer
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      {/* Sélection actuelle des enfants - même style Card que Step 1 */}
      {selectedChildren.length > 0 && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-4">
            <div className="text-sm font-medium mb-2">Personnages de l'histoire :</div>
            <div className="flex flex-wrap gap-2">
              {selectedChildren.map(child => (
                <Badge key={child.id} variant="secondary" className="text-sm gap-1.5">
                  <span>{getGenderIcon(child.gender)}</span>
                  {child.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Objectifs dans une Card - cohérence avec Step 1 */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            🎯 Objectif de l'histoire
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 gap-4">
            {objectives.map(objective => (
              <div
                key={objective.value}
                onClick={() => handleObjectiveSelect(objective.value)}
                className={cn(
                  "relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 active:scale-95",
                  "bg-card backdrop-blur-sm aspect-square flex flex-col items-center justify-center text-center",
                  selectedObjective === objective.value
                    ? 'border-primary bg-primary/20 shadow-lg ring-2 ring-primary/30'
                    : 'border-border hover:border-primary/50 hover:shadow-md'
                )}
              >
                {/* Indicateur de sélection */}
                {selectedObjective === objective.value && (
                  <div className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-primary flex items-center justify-center shadow-sm">
                    <div className="h-1.5 w-1.5 rounded-full bg-white"></div>
                  </div>
                )}

                {/* Icône */}
                <div className="text-4xl mb-3">{objective.icon}</div>

                {/* Titre */}
                <h3 className="font-semibold text-sm text-foreground leading-tight">
                  {objective.label}
                </h3>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MobileObjectiveSelectionStep;
