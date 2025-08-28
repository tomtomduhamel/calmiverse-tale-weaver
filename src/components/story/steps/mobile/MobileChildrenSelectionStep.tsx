import React, { useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Plus } from 'lucide-react';
import { usePersistedStoryCreation } from '@/hooks/stories/usePersistedStoryCreation';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import type { Child } from '@/types/child';
import { calculateAge } from '@/utils/age';
import { cn } from '@/lib/utils';

interface MobileChildrenSelectionStepProps {
  children: Child[];
  preSelectedChildId?: string;
}

const MobileChildrenSelectionStep: React.FC<MobileChildrenSelectionStepProps> = ({
  children,
  preSelectedChildId
}) => {
  const {
    selectedChildrenIds,
    updateSelectedChildren,
    clearPersistedState,
    hasPersistedSession
  } = usePersistedStoryCreation();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Effect pour présélectionner un enfant si spécifié
  useEffect(() => {
    if (preSelectedChildId && children.length > 0 && !hasPersistedSession()) {
      const childExists = children.find(child => child.id === preSelectedChildId);
      if (childExists && !selectedChildrenIds.includes(preSelectedChildId)) {
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

  const handleContinue = useCallback(() => {
    if (selectedChildrenIds.length === 0) {
      toast({
        title: "Sélection requise",
        description: "Veuillez sélectionner au moins un enfant pour continuer",
        variant: "destructive"
      });
      return;
    }
    navigate('/create-story/step-2');
  }, [selectedChildrenIds, navigate, toast]);

  const selectedChildren = children.filter(child => selectedChildrenIds.includes(child.id));

  const getGenderIcon = (gender: string) => {
    switch (gender) {
      case 'boy': return '👦';
      case 'girl': return '👧'; 
      case 'pet': return '🐾';
      default: return '👤';
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-primary/5 to-accent/5">
      {/* En-tête ultra-condensé */}
      <div className="px-4 pt-4 pb-3">
        <h1 className="text-lg font-semibold text-foreground">
          Créer une histoire
        </h1>
      </div>

      {/* Zone de sélection active intégrée */}
      {selectedChildren.length > 0 && (
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg border border-primary/20">
            <span className="text-xs font-medium text-primary flex-shrink-0">Sélectionnés:</span>
            <div className="flex gap-1 flex-wrap">
              {selectedChildren.map(child => (
                <div 
                  key={child.id} 
                  className="flex items-center gap-1 bg-primary text-primary-foreground rounded-full px-2 py-1 text-xs"
                >
                  <span className="text-xs">{getGenderIcon(child.gender)}</span>
                  <span className="font-medium">{child.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Grille des enfants - zone principale avec scroll et espacement sécurisé */}
      <div className="flex-1 px-4 min-h-0 overflow-y-auto">
        <div className="pb-6"> {/* Espacement sécurisé en bas pour éviter la superposition */}
          {children.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
              <div className="text-4xl mb-3">👶</div>
              <p className="text-muted-foreground mb-4 text-sm">
                Aucun enfant n'a été ajouté
              </p>
              <Button 
                variant="outline" 
                onClick={() => navigate('/children')}
                className="gap-2"
                size="sm"
              >
                <Plus className="h-4 w-4" />
                Ajouter un enfant
              </Button>
            </div>
          ) : (
            <div className={cn(
              "grid gap-3",
              children.length <= 2 ? "grid-cols-2" :
              children.length <= 4 ? "grid-cols-2" :
              children.length <= 6 ? "grid-cols-3" : "grid-cols-3"
            )}>
              {children.map(child => (
                <MobileChildCard
                  key={child.id}
                  child={child}
                  isSelected={selectedChildrenIds.includes(child.id)}
                  onToggle={handleChildToggle}
                  getGenderIcon={getGenderIcon}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Navigation flottante fixe en bas */}
      <div className="px-4 py-4 bg-background/95 backdrop-blur-sm border-t border-border/20">
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={() => navigate('/')}
            className="flex-1"
            size="lg"
          >
            Annuler
          </Button>
          <Button 
            onClick={handleContinue} 
            disabled={selectedChildrenIds.length === 0}
            className="flex-1 gap-2"
            size="lg"
          >
            Continuer
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

// Composant pour une carte enfant mobile compacte
interface MobileChildCardProps {
  child: Child;
  isSelected: boolean;
  onToggle: (childId: string) => void;
  getGenderIcon: (gender: string) => string;
}

const MobileChildCard: React.FC<MobileChildCardProps> = ({
  child,
  isSelected,
  onToggle,
  getGenderIcon
}) => {
  const age = calculateAge(child.birthDate);

  return (
    <div
      onClick={() => onToggle(child.id)}
      className={cn(
        "relative aspect-square p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 active:scale-95",
        "bg-white/90 backdrop-blur-sm",
        isSelected 
          ? 'border-primary bg-primary/10 shadow-lg ring-2 ring-primary/30' 
          : 'border-border/40 hover:border-primary/50 hover:shadow-md'
      )}
    >
      {/* Indicateur de sélection ultra-compact */}
      {isSelected && (
        <div className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-primary flex items-center justify-center shadow-sm">
          <div className="h-1.5 w-1.5 rounded-full bg-white"></div>
        </div>
      )}
      
      {/* Contenu principal centré et compact */}
      <div className="flex flex-col items-center justify-center h-full text-center space-y-1">
        {/* Icône */}
        <div className="text-3xl mb-1">{getGenderIcon(child.gender)}</div>
        
        {/* Nom */}
        <h3 className="font-semibold text-sm text-foreground truncate w-full leading-tight">
          {child.name}
        </h3>
        
        {/* Âge - plus discret */}
        <p className="text-xs text-muted-foreground/80">
          {age} an{age > 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
};

export default MobileChildrenSelectionStep;