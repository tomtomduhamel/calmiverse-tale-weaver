import React, { useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, Target } from 'lucide-react';
import { useTitleGeneration } from '@/contexts/TitleGenerationContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import type { Child } from '@/types/child';
import { useMediaQuery } from '@/hooks/use-media-query';
import MobileObjectiveSelectionStep from './mobile/MobileObjectiveSelectionStep';
import { cn } from '@/lib/utils';
import { useStoryGenerationManager } from '@/services/stories/StoryGenerationManager';

interface ObjectiveSelectionStepProps {
  children: Child[];
}

const ObjectiveSelectionStep: React.FC<ObjectiveSelectionStepProps> = ({ children }) => {
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Rendu conditionnel basé sur la taille d'écran
  if (isMobile) {
    return <MobileObjectiveSelectionStep children={children} />;
  }

  // Version desktop - hooks appelés uniquement ici
  return <DesktopObjectiveSelectionStep children={children} />;
};

const DesktopObjectiveSelectionStep: React.FC<ObjectiveSelectionStepProps> = ({ children }) => {
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

  // Version desktop (code existant)
  const selectedChildren = children.filter(child => selectedChildrenIds.includes(child.id));

  const objectives = [
    { value: 'sleep', label: "s'endormir", icon: '🌙', description: 'Histoire apaisante pour le coucher' },
    { value: 'focus', label: 'se concentrer', icon: '🧠', description: 'Histoire stimulante et éducative' },
    { value: 'relax', label: 'se détendre', icon: '🌸', description: 'Histoire douce pour se détendre' },
    { value: 'fun', label: "s'amuser", icon: '🎉', description: 'Histoire joyeuse et divertissante' }
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
      console.log('[ObjectiveSelectionStep] Navigation vers sélection de titres avec:', {
        childrenIds: selectedChildrenIds,
        objective: selectedObjective,
        currentStep: 'objective -> titles'
      });

      // S'assurer que les données sont bien sauvegardées avant navigation
      console.log('[ObjectiveSelectionStep] Sauvegarde des données avant navigation...');

      // Attendre un court délai pour s'assurer que la sauvegarde est terminée
      await new Promise(resolve => setTimeout(resolve, 50));

      // Mettre à jour l'étape actuelle vers 'titles' 
      updateCurrentStep('titles');

      // Attendre encore un peu pour la persistance
      await new Promise(resolve => setTimeout(resolve, 50));

      console.log('[ObjectiveSelectionStep] Navigation vers /create-story-titles');
      navigate('/create-story-titles');
    } catch (error) {
      console.error('[ObjectiveSelectionStep] Erreur navigation:', error);
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

  const selectedObjectiveData = objectives.find(obj => obj.value === selectedObjective);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Indicateur de progression */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
          <span>Sélection des enfants</span>
          <span className="font-medium text-primary">Choix de l'objectif</span>
          <span>Sélection du titre</span>
          <span>Création</span>
        </div>
        <Progress value={50} className="h-2" />
      </div>

      {/* Résumé des enfants sélectionnés */}
      <Card className="bg-muted/30">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium mb-2">Enfants sélectionnés :</h3>
              <div className="flex flex-wrap gap-2">
                {selectedChildren.map(child => (
                  <Badge key={child.id} variant="secondary" className="text-sm">
                    {getGenderIcon(child.gender)} {child.name}
                  </Badge>
                ))}
              </div>
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
          Choisissez l'objectif de l'histoire
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Quel est le but de cette histoire ? Cela nous aidera à créer le contenu parfait pour vos enfants
        </p>
      </div>

      {/* Sélection de l'objectif */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Objectif de l'histoire
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {objectives.map(objective => (
              <div
                key={objective.value}
                onClick={() => handleObjectiveSelect(objective.value)}
                className={`p-6 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${selectedObjective === objective.value
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-border hover:border-primary/50'
                  }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{objective.icon}</span>
                    <div>
                      <h3 className="font-semibold text-lg">{objective.label}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {objective.description}
                      </p>
                    </div>
                  </div>
                  {selectedObjective === objective.value && (
                    <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                      <div className="h-2.5 w-2.5 rounded-full bg-white"></div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={handleBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>

        <div className="flex items-center gap-3">
          {selectedObjectiveData && (
            <Badge variant="outline" className="px-3 py-1">
              {selectedObjectiveData.icon} {selectedObjectiveData.label}
            </Badge>
          )}
          <Button
            onClick={handleContinueToTitles}
            disabled={!selectedObjective}
            className="min-w-[180px]"
          >
            <ArrowRight className="w-4 h-4 mr-2" />
            Continuer
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ObjectiveSelectionStep;