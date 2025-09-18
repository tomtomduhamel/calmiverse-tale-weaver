import React, { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { usePersistedStoryCreation } from '@/hooks/stories/usePersistedStoryCreation';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import type { Child } from '@/types/child';
import { cn } from '@/lib/utils';
import { useStoryGenerationManager } from '@/services/stories/StoryGenerationManager';

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
  } = usePersistedStoryCreation();
  
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

    try {
      console.log('[MobileObjectiveSelectionStep] Déclenchement génération avec:', {
        childrenIds: selectedChildrenIds,
        objective: selectedObjective
      });

      // Déclencher la génération en arrière-plan
      await generateStoryInBackground({
        childrenIds: selectedChildrenIds,
        objective: selectedObjective,
        title: 'Histoire personnalisée'
      });

      // Nettoyer l'état persisté
      clearPersistedState();

      // Afficher un message de succès
      toast({
        title: "✨ Génération lancée !",
        description: "Votre histoire sera bientôt prête. Vous pouvez naviguer librement.",
      });

      // Naviguer vers la bibliothèque
      navigate('/library');
    } catch (error) {
      console.error('[MobileObjectiveSelectionStep] Erreur génération:', error);
      toast({
        title: "Erreur",
        description: "Impossible de démarrer la génération. Veuillez réessayer.",
        variant: "destructive"
      });
    }
  }, [selectedObjective, selectedChildrenIds, generateStoryInBackground, clearPersistedState, navigate, toast]);

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
    <div className="bg-gradient-to-b from-primary/5 to-accent/5 min-h-screen">
      {/* En-tête avec progression et navigation */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/20 px-4 pt-4 pb-3">
        {/* Navigation avec flèche retour et titre d'étape */}
        <div className="flex items-center justify-between mb-4">
          <Button 
            variant="ghost" 
            onClick={handleBack}
            size="sm"
            className="p-1"
          >
            <ArrowLeft className="w-5 h-5 text-primary" />
          </Button>
          
          <h2 className="text-lg font-semibold text-primary">
            Étape 2 sur 3
          </h2>
          
          <Button 
            onClick={handleContinueToTitles} 
            disabled={!selectedObjective}
            size="sm"
            className={cn(
              "gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200",
              selectedObjective 
                ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm" 
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            Continuer
            <ArrowRight className="w-3 h-3" />
          </Button>
        </div>

        {/* Barre de progression */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
            <div className="w-1/2 h-full bg-gradient-to-r from-primary to-primary/80 rounded-full"></div>
          </div>
        </div>

        {/* Zone des enfants sélectionnés */}
        {selectedChildren.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {selectedChildren.map(child => (
              <div 
                key={child.id} 
                className="flex items-center gap-1 bg-primary text-primary-foreground rounded-full px-3 py-1.5 text-sm"
              >
                <span className="text-sm">{getGenderIcon(child.gender)}</span>
                <span className="font-medium">{child.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Contenu principal */}
      <div className="px-4 py-6">
        {/* Grille des objectifs 2x2 */}
        <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
          {objectives.map(objective => (
            <div 
              key={objective.value}
              onClick={() => handleObjectiveSelect(objective.value)}
              className={cn(
                "relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 active:scale-95",
                "bg-white/90 backdrop-blur-sm aspect-square flex flex-col items-center justify-center text-center",
                selectedObjective === objective.value 
                  ? 'border-primary bg-primary/10 shadow-lg ring-2 ring-primary/30' 
                  : 'border-border/40 hover:border-primary/50 hover:shadow-md'
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
      </div>
    </div>
  );
};

export default MobileObjectiveSelectionStep;