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
import { useIsMobile } from '@/hooks/use-mobile';
import MobileChildrenSelectionStep from './mobile/MobileChildrenSelectionStep';
import StoryCreationErrorBoundary from '@/components/ui/StoryCreationErrorBoundary';
interface ChildrenSelectionStepProps {
  children: Child[];
  preSelectedChildId?: string;
}
const ChildrenSelectionStep: React.FC<ChildrenSelectionStepProps> = ({
  children,
  preSelectedChildId
}) => {
  const isMobile = useIsMobile();
  const {
    selectedChildrenIds,
    updateSelectedChildren,
    clearPersistedState,
    hasPersistedSession
  } = usePersistedStoryCreation();
  const navigate = useNavigate();
  const {
    toast
  } = useToast();

  // Ajout d'une option de reset automatique pour éviter les blocages
  // useEffect(() => {
  //   // Décommentez pour reset automatique à chaque arrivée sur l'étape 1
  //   clearPersistedState();
  // }, [clearPersistedState]);

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
    const newSelection = selectedChildrenIds.includes(childId) ? selectedChildrenIds.filter(id => id !== childId) : [...selectedChildrenIds, childId];
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
      case 'boy':
        return '👦';
      case 'girl':
        return '👧';
      case 'pet':
        return '🐾';
      default:
        return '👤';
    }
  };

  // Optimize display: reverse order so most popular appear first (left side)
  const displayChildren = [...children].reverse();

  // Rediriger vers la version mobile si sur mobile
  if (isMobile) {
    return (
      <StoryCreationErrorBoundary>
        <MobileChildrenSelectionStep 
          children={children} 
          preSelectedChildId={preSelectedChildId} 
        />
      </StoryCreationErrorBoundary>
    );
  }

  // Split children into chunks for horizontal scrolling if more than 10
  const maxVisibleCards = 10;
  const needsScrolling = children.length > maxVisibleCards;
  
  return <StoryCreationErrorBoundary>
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Notification de session récupérée */}
      {hasPersistedSession()}

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
          {needsScrolling ? <div className="relative group">
              {/* Message contextuel */}
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">
                  🏆 Les plus populaires en premier
                </p>
                <p className="text-xs text-muted-foreground md:hidden">
                  Glissez horizontalement →
                </p>
              </div>
              
              {/* Conteneur de scroll horizontal optimisé */}
              <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide scroll-smooth" style={{
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch'
          }}>
                {displayChildren.map(child => <div key={child.id} className="flex-none w-44 sm:w-48" style={{
              scrollSnapAlign: 'start'
            }}>
                    <ChildCard child={child} isSelected={selectedChildrenIds.includes(child.id)} onToggle={handleChildToggle} getGenderIcon={getGenderIcon} />
                  </div>)}
              </div>
              
              {/* Indicateurs visuels de scroll */}
              <div className="absolute left-0 top-12 bottom-4 w-6 bg-gradient-to-r from-background to-transparent pointer-events-none opacity-50"></div>
              <div className="absolute right-0 top-12 bottom-4 w-6 bg-gradient-to-l from-background to-transparent pointer-events-none opacity-50"></div>
            </div> : <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8">
              {displayChildren.map(child => <ChildCard key={child.id} child={child} isSelected={selectedChildrenIds.includes(child.id)} onToggle={handleChildToggle} getGenderIcon={getGenderIcon} />)}
            </div>}
        </CardContent>
      </Card>

      {/* Sélection actuelle et navigation */}
      <div className="flex justify-between items-center">
        <div className="flex flex-wrap gap-2">
          {selectedChildren.map(child => <Badge key={child.id} variant="secondary" className="text-sm">
              {getGenderIcon(child.gender)} {child.name}
            </Badge>)}
          {selectedChildren.length === 0 && <span className="text-muted-foreground text-sm">Aucun enfant sélectionné</span>}
        </div>
        
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate('/')}>
            Annuler
          </Button>
          <Button onClick={handleContinue} disabled={selectedChildrenIds.length === 0} className="min-w-[140px]">
            Continuer
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  </StoryCreationErrorBoundary>;
};

// Composant pour une carte enfant individuelle
interface ChildCardProps {
  child: Child & {
    storiesCount?: number;
  };
  isSelected: boolean;
  onToggle: (childId: string) => void;
  getGenderIcon: (gender: string) => string;
}
const ChildCard: React.FC<ChildCardProps> = ({
  child,
  isSelected,
  onToggle,
  getGenderIcon
}) => {
  const age = calculateAge(child.birthDate);
  const storiesCount = (child as any).storiesCount || 0;

  // Determine popularity level for visual indicators
  const isTopPerformer = storiesCount >= 3;
  const isPopular = storiesCount > 5;
  return <div onClick={() => onToggle(child.id)} className={`relative p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-105 ${isSelected ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-primary/50'} ${isPopular ? 'ring-1 ring-primary/20' : ''}`}>
      {/* Top badges */}
      {isTopPerformer && <div className="absolute -top-2 -right-2 z-10">
          {isPopular ? <Badge className="bg-gradient-to-r from-yellow-400 to-orange-400 text-black font-bold text-xs px-2 py-1">
              🏆 TOP
            </Badge> : <Badge variant="secondary" className="text-xs px-2 py-1 bg-primary/10">
              ⭐
            </Badge>}
        </div>}
      
      {/* Main content - more compact layout */}
      <div className="space-y-2">
        {/* Name and icon row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-lg flex-shrink-0">{getGenderIcon(child.gender)}</span>
            <h3 className="font-semibold text-sm truncate">{child.name}</h3>
          </div>
          {isSelected && <div className="h-4 w-4 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
              <div className="h-1.5 w-1.5 rounded-full bg-white"></div>
            </div>}
        </div>
        
        {/* Age and stories count */}
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs px-2 py-0.5">
            {age} an{age > 1 ? 's' : ''}
          </Badge>
          {storiesCount > 0 && <Badge variant="secondary" className="text-xs px-2 py-0.5">
              📚 {storiesCount}
            </Badge>}
        </div>
        
        {/* Teddy name - more compact */}
        {child.teddyName && <div className="text-xs text-muted-foreground truncate">
            🧸 {child.teddyName}
          </div>}
      </div>
    </div>;
};
export default ChildrenSelectionStep;