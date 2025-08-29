import React, { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { usePersistedStoryCreation } from '@/hooks/stories/usePersistedStoryCreation';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import type { Child } from '@/types/child';
import { cn } from '@/lib/utils';

interface MobileObjectiveSelectionStepProps {
  children: Child[];
}

const MobileObjectiveSelectionStep: React.FC<MobileObjectiveSelectionStepProps> = ({ children }) => {
  const {
    selectedChildrenIds,
    selectedObjective,
    updateSelectedObjective,
    updateCurrentStep
  } = usePersistedStoryCreation();
  
  const navigate = useNavigate();
  const { toast } = useToast();

  const selectedChildren = children.filter(child => selectedChildrenIds.includes(child.id));

  const objectives = [
    { value: 'focus', label: 'Concentration', icon: '🧠', description: 'Histoire stimulante et éducative' },
    { value: 'relax', label: 'Relaxation', icon: '🌸', description: 'Histoire douce pour se détendre' },
    { value: 'fun', label: 'Amusement', icon: '🎉', description: 'Histoire joyeuse et divertissante' }
  ];

  const handleObjectiveSelect = useCallback((objective: string) => {
    updateSelectedObjective(objective);
  }, [updateSelectedObjective]);

  const handleContinueToTitles = useCallback(() => {
    if (!selectedObjective) {
      toast({
        title: "Objectif requis",
        description: "Veuillez sélectionner un objectif pour continuer",
        variant: "destructive"
      });
      return;
    }

    updateCurrentStep('titles');
    navigate('/create-story/step-3');
  }, [selectedObjective, updateCurrentStep, navigate, toast]);

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
      {/* En-tête avec navigation compacte */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/20 px-4 pt-4 pb-3">
        {/* Indicateur de progression minimaliste */}
        <div className="flex items-center gap-1 mb-3 justify-center">
          <div className="w-6 h-1 bg-primary rounded-full"></div>
          <div className="w-6 h-1 bg-primary rounded-full"></div>
          <div className="w-6 h-1 bg-muted rounded-full"></div>
          <div className="w-6 h-1 bg-muted rounded-full"></div>
        </div>

        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-foreground">
            Choix de l'objectif
          </h1>
          {/* Boutons de navigation compacts en haut */}
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              onClick={handleBack}
              size="sm"
              className="text-xs px-3"
            >
              Retour
            </Button>
            <Button 
              onClick={handleContinueToTitles} 
              disabled={!selectedObjective}
              size="sm"
              className="gap-1 text-xs px-3"
            >
              Continuer
              <ArrowRight className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Zone des enfants sélectionnés compacte */}
        {selectedChildren.length > 0 && (
          <div className="mt-3">
            <div className="flex items-center gap-2 p-2 bg-primary/10 rounded-lg border border-primary/20">
              <span className="text-xs font-medium text-primary flex-shrink-0">Enfants:</span>
              <div className="flex gap-1 flex-wrap">
                {selectedChildren.map(child => (
                  <div 
                    key={child.id} 
                    className="flex items-center gap-1 bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs"
                  >
                    <span className="text-xs">{getGenderIcon(child.gender)}</span>
                    <span className="font-medium">{child.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Contenu principal */}
      <div className="px-4 py-6">
        {/* Titre et description épurés */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Choisissez l'objectif de l'histoire
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Quel est le but de cette histoire ? Cela nous aidera à créer le contenu parfait pour vos enfants
          </p>
        </div>

        {/* Grille des objectifs - design épuré */}
        <div className="space-y-3 max-w-sm mx-auto">
          {objectives.map(objective => (
            <div 
              key={objective.value}
              onClick={() => handleObjectiveSelect(objective.value)}
              className={cn(
                "relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 active:scale-95",
                "bg-white/90 backdrop-blur-sm",
                selectedObjective === objective.value 
                  ? 'border-primary bg-primary/10 shadow-lg ring-2 ring-primary/30' 
                  : 'border-border/40 hover:border-primary/50 hover:shadow-md'
              )}
            >
              {/* Indicateur de sélection */}
              {selectedObjective === objective.value && (
                <div className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-primary flex items-center justify-center shadow-sm">
                  <div className="h-1.5 w-1.5 rounded-full bg-white"></div>
                </div>
              )}
              
              {/* Contenu principal centré */}
              <div className="flex items-center space-x-3">
                {/* Icône */}
                <div className="text-2xl flex-shrink-0">{objective.icon}</div>
                
                {/* Texte */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-base text-foreground">
                    {objective.label}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                    {objective.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MobileObjectiveSelectionStep;