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
    <div className="bg-gradient-to-b from-primary/5 to-accent/5 min-h-screen">
      {/* En-tête avec navigation compacte - fixe */}
      <div className="sticky top-0 z-10 bg-gradient-to-b from-primary/5 to-accent/5 px-4 pt-4 pb-3">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-foreground">
            Créer une histoire
          </h1>
          {/* Boutons de navigation compacts en haut */}
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/')}
              size="sm"
              className="text-xs px-3"
            >
              Annuler
            </Button>
            <Button 
              onClick={handleContinue} 
              disabled={selectedChildrenIds.length === 0}
              size="sm"
              className="gap-1 text-xs px-3"
            >
              Continuer
              <ArrowRight className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Zone de sélection active intégrée */}
        {selectedChildren.length > 0 && (
          <div className="mt-3">
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
      </div>

      {/* Grille des enfants - scroll naturel de la page */}
      <div className="px-4 pb-4">
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
        "relative aspect-square p-2 rounded-xl border-2 cursor-pointer transition-all duration-200 active:scale-95",
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
      <div className="flex flex-col items-center justify-center h-full text-center space-y-0.5">
        {/* Icône */}
        <div className="text-2xl">{getGenderIcon(child.gender)}</div>
        
        {/* Nom - plus visible et prioritaire */}
        <h3 className="font-semibold text-xs text-foreground truncate w-full leading-tight px-1">
          {child.name}
        </h3>
        
        {/* Âge - encore plus discret */}
        <p className="text-[10px] text-muted-foreground/70">
          {age} an{age > 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
};

export default MobileChildrenSelectionStep;