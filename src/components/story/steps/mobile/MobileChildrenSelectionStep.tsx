import React, { useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowRight, Users } from 'lucide-react';
import { usePersistedStoryCreation } from '@/hooks/stories/usePersistedStoryCreation';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import type { Child } from '@/types/child';
import { calculateAge } from '@/utils/age';

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
        console.log('[MobileChildrenSelectionStep] Présélection de l\'enfant:', childExists.name);
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
    <div className="space-y-6 px-4">
      {/* Indicateur de progression */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
          <span className="font-medium text-primary">Enfants</span>
          <span>Objectif</span>
          <span>Titre</span>
          <span>Création</span>
        </div>
        <Progress value={25} className="h-2" />
      </div>

      {/* En-tête mobile */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Choisissez vos enfants
        </h1>
        <p className="text-muted-foreground text-sm">
          Sélectionnez les enfants pour qui créer l'histoire
        </p>
      </div>

      {/* Navigation mobile en haut */}
      <div className="flex gap-3 mb-6">
        <Button variant="outline" onClick={() => navigate('/')} className="flex-1">
          Annuler
        </Button>
        <Button 
          onClick={handleContinue} 
          disabled={selectedChildrenIds.length === 0} 
          className="flex-1"
        >
          Continuer
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      {/* Liste des enfants - version mobile verticale */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5" />
            Vos enfants ({children.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
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
        </CardContent>
      </Card>

      {/* Sélection actuelle */}
      {selectedChildren.length > 0 && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-4">
            <div className="text-sm font-medium mb-2">Enfants sélectionnés :</div>
            <div className="flex flex-wrap gap-2">
              {selectedChildren.map(child => (
                <Badge key={child.id} variant="secondary" className="text-sm">
                  {getGenderIcon(child.gender)} {child.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
};

// Composant pour une carte enfant mobile
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
      className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
        isSelected 
          ? 'border-primary bg-primary/5 shadow-sm' 
          : 'border-border hover:border-primary/50'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{getGenderIcon(child.gender)}</span>
          <div>
            <h3 className="font-semibold">{child.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">
                {age} an{age > 1 ? 's' : ''}
              </Badge>
              {child.teddyName && (
                <span className="text-xs text-muted-foreground">
                  🧸 {child.teddyName}
                </span>
              )}
            </div>
          </div>
        </div>
        {isSelected && (
          <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
            <div className="h-2 w-2 rounded-full bg-white"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileChildrenSelectionStep;