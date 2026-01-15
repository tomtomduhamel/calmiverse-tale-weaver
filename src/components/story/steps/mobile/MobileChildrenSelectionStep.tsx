import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import CharacterCategoryFilter from '../CharacterCategoryFilter';
import { getProfileCategory, getCategoryDisplay, countByCategory, type ProfileCategory } from '@/utils/profileCategory';

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

  // États des filtres
  const [categoryFilter, setCategoryFilter] = useState<'all' | ProfileCategory>('all');
  const [childGenderFilter, setChildGenderFilter] = useState<'all' | 'boy' | 'girl'>('all');

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
          Choisissez vos personnages
        </h1>
        <p className="text-muted-foreground text-sm">
          Sélectionnez les personnages pour qui créer l'histoire
        </p>
      </div>

      {/* Navigation mobile sticky en haut */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm py-3 -mx-4 px-4 flex gap-3 mb-3">
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
        <CardHeader className="pb-4 space-y-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5" />
            Vos personnages ({children.length})
          </CardTitle>

          {/* Filtres de catégorie - version compacte pour mobile */}
          <CharacterCategoryFilter
            categoryFilter={categoryFilter}
            onCategoryFilterChange={setCategoryFilter}
            childGenderFilter={childGenderFilter}
            onChildGenderFilterChange={setChildGenderFilter}
            counts={categoryCounts}
            compact
          />
        </CardHeader>
        <CardContent className="pt-0">
          {displayChildren.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              Aucun personnage ne correspond aux filtres
            </div>
          ) : (
            <div className="space-y-3">
              {displayChildren.map(child => (
                <MobileChildCard
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
                  p-4 rounded-lg border-2 border-dashed border-border/50
                  cursor-pointer hover:border-primary/60 hover:bg-card/50
                  transition-all duration-200 ease-in-out
                  flex items-center gap-3
                  text-muted-foreground hover:text-foreground
                "
              >
                <div className="h-10 w-10 rounded-full bg-secondary/50 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl font-light">+</span>
                </div>
                <span className="font-medium">Ajouter un personnage</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sélection actuelle */}
      {selectedChildren.length > 0 && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-4">
            <div className="text-sm font-medium mb-2">Personnages sélectionnés :</div>
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
}

const MobileChildCard: React.FC<MobileChildCardProps> = ({
  child,
  isSelected,
  onToggle
}) => {
  const age = calculateAge(child.birthDate);
  const { icon: CategoryIcon, color } = getCategoryDisplay(child);

  return (
    <div
      onClick={() => onToggle(child.id)}
      className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${isSelected
          ? 'border-primary bg-primary/5 shadow-sm'
          : 'border-border hover:border-primary/50'
        }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CategoryIcon className={`h-6 w-6 ${color}`} />
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
