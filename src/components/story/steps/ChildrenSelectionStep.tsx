import React, { useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { RefreshCw, Users, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { usePersistedStoryCreation } from '@/hooks/stories/usePersistedStoryCreation';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import type { Child } from '@/types/child';
import { ScrollArea } from '@/components/ui/scroll-area';
import { calculateAge } from '@/utils/age';

interface ChildrenSelectionStepProps {
  children: Child[];
  preSelectedChildId?: string;
}

const ChildrenSelectionStep: React.FC<ChildrenSelectionStepProps> = ({ children, preSelectedChildId }) => {
  const {
    selectedChildrenIds,
    updateSelectedChildren,
    clearPersistedState,
    hasPersistedSession
  } = usePersistedStoryCreation();
  
  const navigate = useNavigate();
  const { toast } = useToast();

  // Effect pour présélectionner un enfant si spécifié et pas déjà de session
  useEffect(() => {
    if (preSelectedChildId && children.length > 0 && !hasPersistedSession()) {
      const childExists = children.find(child => child.id === preSelectedChildId);
      if (childExists && !selectedChildrenIds.includes(preSelectedChildId)) {
        console.log('[ChildrenSelectionStep] Présélection de l\'enfant:', childExists.name);
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

  const handleRestart = useCallback(() => {
    clearPersistedState();
    toast({
      title: "Session réinitialisée",
      description: "Vous pouvez recommencer la création d'histoire."
    });
  }, [clearPersistedState, toast]);

  const selectedChildren = children.filter(child => selectedChildrenIds.includes(child.id));

  // Helper function to get gender icon
  const getGenderIcon = (gender: string) => {
    switch (gender) {
      case 'boy': return '👦';
      case 'girl': return '👧';
      case 'pet': return '🐾';
      default: return '👤';
    }
  };

  // Split children into chunks for horizontal scrolling if more than 8
  const maxVisibleCards = 8;
  const needsScrolling = children.length > maxVisibleCards;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
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
      <div className="mb-8">
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
          <span className="font-medium text-primary">Sélection des enfants</span>
          <span>Choix de l'objectif</span>
          <span>Sélection du titre</span>
          <span>Création</span>
        </div>
        <Progress value={25} className="h-2" />
      </div>

      {/* En-tête */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Choisissez vos enfants
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Sélectionnez les enfants ou animaux de compagnie pour qui vous souhaitez créer une histoire personnalisée
        </p>
      </div>

      {/* Carte de sélection des enfants */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Vos enfants et animaux ({children.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {needsScrolling ? (
            <ScrollArea className="w-full">
              <div className="flex gap-4 pb-4" style={{ width: `${Math.ceil(children.length / 2) * 280}px` }}>
                {children.map(child => (
                  <div 
                    key={child.id}
                    className="flex-none w-64"
                  >
                    <ChildCard 
                      child={child}
                      isSelected={selectedChildrenIds.includes(child.id)}
                      onToggle={handleChildToggle}
                      getGenderIcon={getGenderIcon}
                    />
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {children.map(child => (
                <ChildCard 
                  key={child.id}
                  child={child}
                  isSelected={selectedChildrenIds.includes(child.id)}
                  onToggle={handleChildToggle}
                  getGenderIcon={getGenderIcon}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sélection actuelle et navigation */}
      <div className="flex justify-between items-center">
        <div className="flex flex-wrap gap-2">
          {selectedChildren.map(child => (
            <Badge key={child.id} variant="secondary" className="text-sm">
              {getGenderIcon(child.gender)} {child.name}
            </Badge>
          ))}
          {selectedChildren.length === 0 && (
            <span className="text-muted-foreground text-sm">Aucun enfant sélectionné</span>
          )}
        </div>
        
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate('/')}>
            Annuler
          </Button>
          <Button 
            onClick={handleContinue}
            disabled={selectedChildrenIds.length === 0}
            className="min-w-[140px]"
          >
            Continuer
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
};

// Composant pour une carte enfant individuelle
interface ChildCardProps {
  child: Child;
  isSelected: boolean;
  onToggle: (childId: string) => void;
  getGenderIcon: (gender: string) => string;
}

const ChildCard: React.FC<ChildCardProps> = ({ child, isSelected, onToggle, getGenderIcon }) => {
  const age = calculateAge(child.birthDate);
  
  return (
    <div 
      onClick={() => onToggle(child.id)}
      className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
        isSelected 
          ? 'border-primary bg-primary/5 shadow-sm' 
          : 'border-border hover:border-primary/50'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{getGenderIcon(child.gender)}</span>
            <h3 className="font-semibold text-base">{child.name}</h3>
          </div>
          <Badge variant="outline" className="text-xs">
            {age} an{age > 1 ? 's' : ''}
          </Badge>
        </div>
        {isSelected && (
          <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
            <div className="h-2 w-2 rounded-full bg-white"></div>
          </div>
        )}
      </div>
      
      {child.teddyName && (
        <div className="text-sm text-muted-foreground">
          🧸 {child.teddyName}
        </div>
      )}
    </div>
  );
};

export default ChildrenSelectionStep;