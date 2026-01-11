import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Users, ArrowRight } from 'lucide-react';
import { usePersistedStoryCreation } from '@/hooks/stories/usePersistedStoryCreation';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import type { Child } from '@/types/child';
import { calculateAge } from '@/utils/age';
import { useIsMobile } from '@/hooks/use-mobile';
import MobileChildrenSelectionStep from './mobile/MobileChildrenSelectionStep';
import StoryCreationErrorBoundary from '@/components/ui/StoryCreationErrorBoundary';
import CharacterCategoryFilter from './CharacterCategoryFilter';
import { getProfileCategory, getCategoryDisplay, countByCategory, type ProfileCategory } from '@/utils/profileCategory';

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
  const { toast } = useToast();

  // États des filtres
  const [categoryFilter, setCategoryFilter] = useState<'all' | ProfileCategory>('all');
  const [childGenderFilter, setChildGenderFilter] = useState<'all' | 'boy' | 'girl'>('all');

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

  // Compteurs par catégorie
  const categoryCounts = useMemo(() => countByCategory(children), [children]);

  // Filtrage et tri des enfants
  const displayChildren = useMemo(() => {
    return [...children]
      .filter(child => {
        const category = getProfileCategory(child);

        // Filtre par catégorie principale
        if (categoryFilter !== 'all' && category !== categoryFilter) {
          return false;
        }

        // Filtre par genre (seulement pour les enfants)
        if (categoryFilter === 'child' && childGenderFilter !== 'all') {
          if (child.gender !== childGenderFilter) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        const aStories = (a as any).storiesCount || 0;
        const bStories = (b as any).storiesCount || 0;
        return bStories - aStories;
      });
  }, [children, categoryFilter, childGenderFilter]);

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
        <CardHeader className="space-y-4">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Vos personnages ({children.length})
          </CardTitle>

          {/* Filtres de catégorie */}
          <CharacterCategoryFilter
            categoryFilter={categoryFilter}
            onCategoryFilterChange={setCategoryFilter}
            childGenderFilter={childGenderFilter}
            onChildGenderFilterChange={setChildGenderFilter}
            counts={categoryCounts}
          />
        </CardHeader>
        <CardContent className="px-0">
          {displayChildren.length === 0 ? (
            <div className="px-6 py-8 text-center text-muted-foreground">
              Aucun personnage ne correspond aux filtres sélectionnés
            </div>
          ) : needsScrolling ? (
            <div className="space-y-3">
              {/* Message contextuel */}
              <div className="flex items-center justify-between px-6">
                <p className="text-sm text-muted-foreground">
                  🏆 Les plus populaires en premier
                </p>
                <p className="text-xs text-muted-foreground">
                  Glissez horizontalement →
                </p>
              </div>

              {/* Conteneur de scroll horizontal optimisé */}
              <div
                className="flex gap-3 overflow-x-auto px-6 pb-4 scrollbar-hide scroll-smooth snap-x snap-mandatory"
                style={{ WebkitOverflowScrolling: 'touch' }}
              >
                {displayChildren.map(child => (
                  <div key={child.id} className="flex-none w-44 snap-start">
                    <ChildCard
                      child={child}
                      isSelected={selectedChildrenIds.includes(child.id)}
                      onToggle={handleChildToggle}
                    />
                  </div>
                ))}

                {/* Carte "Ajouter un enfant" (Scroll horizontal) */}
                <div className="flex-none w-44 snap-start">
                  <div
                    onClick={() => navigate('/children?action=create')}
                    className="
                      h-full relative p-4 rounded-xl border-2 border-dashed border-border/50
                      cursor-pointer hover:border-primary/60 hover:bg-card/50
                      transition-all duration-300 ease-in-out
                      flex flex-col items-center justify-center gap-2
                      text-muted-foreground hover:text-foreground min-h-[140px]
                    "
                  >
                    <div className="h-10 w-10 rounded-full bg-secondary/50 flex items-center justify-center">
                      <span className="text-2xl font-light">+</span>
                    </div>
                    <span className="font-medium text-sm text-center">Ajouter un<br />personnage</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="px-6">
              <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {displayChildren.map(child => (
                  <ChildCard
                    key={child.id}
                    child={child}
                    isSelected={selectedChildrenIds.includes(child.id)}
                    onToggle={handleChildToggle}
                  />
                ))}

                {/* Carte "Ajouter un enfant" */}
                <div
                  onClick={() => navigate('/children?action=create')}
                  className="
                    relative p-4 rounded-xl border-2 border-dashed border-border/50 
                    cursor-pointer hover:border-primary/60 hover:bg-card/50
                    transition-all duration-300 ease-in-out
                    flex flex-col items-center justify-center gap-2
                    min-h-[140px] text-muted-foreground hover:text-foreground
                  "
                >
                  <div className="h-10 w-10 rounded-full bg-secondary/50 flex items-center justify-center">
                    <span className="text-2xl font-light">+</span>
                  </div>
                  <span className="font-medium text-sm text-center">Ajouter un<br />personnage</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sélection actuelle et navigation */}
      <div className="flex justify-between items-center">
        <div className="flex flex-wrap gap-2">
          {selectedChildren.map(child => {
            const { icon: Icon, color } = getCategoryDisplay(child);
            return (
              <Badge key={child.id} variant="secondary" className="text-sm gap-1.5">
                <Icon className={`h-3.5 w-3.5 ${color}`} />
                {child.name}
              </Badge>
            );
          })}
          {selectedChildren.length === 0 && <span className="text-muted-foreground text-sm">Aucun personnage sélectionné</span>}
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
}

const ChildCard: React.FC<ChildCardProps> = ({
  child,
  isSelected,
  onToggle
}) => {
  const age = calculateAge(child.birthDate);
  const storiesCount = (child as any).storiesCount || 0;
  const { icon: CategoryIcon, color } = getCategoryDisplay(child);

  // Determine popularity level for visual indicators
  const isTopPerformer = storiesCount >= 3;
  const isPopular = storiesCount > 5;

  return (
    <div
      onClick={() => onToggle(child.id)}
      className={`
        relative p-4 rounded-xl border-2 cursor-pointer 
        transition-all duration-300 ease-in-out
        hover:shadow-lg hover:-translate-y-0.5
        ${isSelected
          ? 'border-primary bg-primary/5 shadow-md'
          : 'border-border/50 hover:border-primary/60 bg-card'
        }
      `}
    >
      {/* Top badge - minimaliste */}
      {isTopPerformer && (
        <div className="absolute -top-2 -right-2 z-10">
          <Badge
            className={`
              text-xs px-2.5 py-1 font-semibold shadow-sm
              ${isPopular
                ? 'bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-300'
                : 'bg-secondary text-secondary-foreground'
              }
            `}
          >
            {isPopular ? '🏆 TOP' : '⭐'}
          </Badge>
        </div>
      )}

      {/* Main content */}
      <div className="space-y-3">
        {/* Name and selection indicator */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <CategoryIcon className={`h-5 w-5 flex-shrink-0 ${color}`} />
            <h3 className="font-semibold text-base truncate">{child.name}</h3>
          </div>
          {isSelected && (
            <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
              <div className="h-2 w-2 rounded-full bg-primary-foreground" />
            </div>
          )}
        </div>

        {/* Age and stories count */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">
            {age} an{age > 1 ? 's' : ''}
          </span>
          {storiesCount > 0 && (
            <span className="text-xs text-muted-foreground">
              📚 {storiesCount}
            </span>
          )}
        </div>

        {/* Teddy name */}
        {child.teddyName && (
          <div className="text-xs text-muted-foreground truncate pt-1 border-t border-border/30">
            🧸 {child.teddyName}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChildrenSelectionStep;