import React, { useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
      {/* En-tête condensé */}
      <div className="px-4 pt-6 pb-4 bg-white/80 backdrop-blur-sm border-b border-border/20">
        <h1 className="text-xl font-bold text-foreground mb-1">
          Créer une histoire
        </h1>
        <p className="text-sm text-muted-foreground">
          Sélectionnez vos enfants ou animaux
        </p>
      </div>

      {/* Zone de sélection active */}
      {selectedChildren.length > 0 && (
        <div className="px-4 py-3 bg-primary/10 border-b border-primary/20">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-primary">Sélectionnés:</span>
            {selectedChildren.map(child => (
              <Badge 
                key={child.id} 
                variant="default" 
                className="bg-primary text-primary-foreground text-xs px-2 py-1"
              >
                {getGenderIcon(child.gender)} {child.name}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Grille des enfants - zone principale */}
      <div className="flex-1 px-4 py-4 overflow-y-auto">
        {children.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-4xl mb-4">👶</div>
            <p className="text-muted-foreground mb-4">
              Aucun enfant n'a été ajouté
            </p>
            <Button 
              variant="outline" 
              onClick={() => navigate('/children')}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Ajouter un enfant
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
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

      {/* Navigation fixe en bas */}
      <div className="px-4 py-4 bg-white/95 backdrop-blur-sm border-t border-border/20 pb-safe">
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={() => navigate('/')}
            className="flex-1"
          >
            Annuler
          </Button>
          <Button 
            onClick={handleContinue} 
            disabled={selectedChildrenIds.length === 0}
            className="flex-1 gap-2"
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
        "relative p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 active:scale-98",
        "bg-white/80 backdrop-blur-sm",
        isSelected 
          ? 'border-primary bg-primary/10 shadow-soft ring-2 ring-primary/20' 
          : 'border-border/30 hover:border-primary/40 hover:shadow-soft'
      )}
    >
      {/* Indicateur de sélection */}
      {isSelected && (
        <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-primary flex items-center justify-center">
          <div className="h-2 w-2 rounded-full bg-white"></div>
        </div>
      )}
      
      {/* Contenu principal */}
      <div className="text-center space-y-2">
        {/* Icône et nom */}
        <div className="text-2xl">{getGenderIcon(child.gender)}</div>
        <div>
          <h3 className="font-semibold text-sm text-foreground truncate">
            {child.name}
          </h3>
          <p className="text-xs text-muted-foreground">
            {age} an{age > 1 ? 's' : ''}
          </p>
        </div>
        
        {/* Doudou si présent */}
        {child.teddyName && (
          <div className="text-xs text-muted-foreground truncate">
            🧸 {child.teddyName}
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileChildrenSelectionStep;