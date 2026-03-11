import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTitleGeneration } from '@/contexts/TitleGenerationContext';
import { useStoryObjectives } from '@/hooks/useStoryObjectives';
import { MagicChildrenDrawer } from './MagicChildrenDrawer';
import { MagicObjectiveDrawer } from './MagicObjectiveDrawer';
import { Button } from '@/components/ui/button';
import { Sparkles, ChevronDown } from 'lucide-react';
import type { Child } from '@/types/child';

interface MagicStoryCreatorProps {
  childrenList: Child[];
  preSelectedChildId?: string;
}

const MagicStoryCreator: React.FC<MagicStoryCreatorProps> = ({ childrenList, preSelectedChildId }) => {
  const {
    selectedChildrenIds,
    updateSelectedChildren,
    selectedObjective,
    updateSelectedObjective,
    hasPersistedSession
  } = useTitleGeneration();
  
  const { objectives } = useStoryObjectives();
  const navigate = useNavigate();

  const [isChildrenDrawerOpen, setIsChildrenDrawerOpen] = useState(false);
  const [isObjectiveDrawerOpen, setIsObjectiveDrawerOpen] = useState(false);

  // Présélection si spécifié
  useEffect(() => {
    if (preSelectedChildId && childrenList.length > 0 && !hasPersistedSession()) {
      const childExists = childrenList.find(c => c.id === preSelectedChildId);
      if (childExists && !selectedChildrenIds.includes(preSelectedChildId)) {
        updateSelectedChildren([preSelectedChildId]);
      }
    }
  }, [preSelectedChildId, childrenList, hasPersistedSession, selectedChildrenIds, updateSelectedChildren]);

  // Générer le texte pour les enfants sélectionnés
  const getSelectedChildrenText = () => {
    if (selectedChildrenIds.length === 0) return "Choisir les personnages";
    if (selectedChildrenIds.length === 1) {
      const child = childrenList.find(c => c.id === selectedChildrenIds[0]);
      return child ? child.name : "1 personnage";
    }
    if (selectedChildrenIds.length === 2) {
      const child1 = childrenList.find(c => c.id === selectedChildrenIds[0]);
      const child2 = childrenList.find(c => c.id === selectedChildrenIds[1]);
      return `${child1?.name} et ${child2?.name}`;
    }
    
    // Pour 3 enfants et plus
    const firstChild = childrenList.find(c => c.id === selectedChildrenIds[0]);
    const remainingCount = selectedChildrenIds.length - 1;
    return `${firstChild?.name} et ${remainingCount} autre${remainingCount > 1 ? 's' : ''}`;
  };

  // Générer le texte pour l'objectif sélectionné
  const getSelectedObjectiveText = () => {
    if (!selectedObjective) return "Choisir un objectif";
    const obj = objectives.find(o => o.id === selectedObjective);
    return obj ? obj.label.toLowerCase() : "Choisir un objectif";
  };

  const selectedChildrenCount = selectedChildrenIds.length;
  const isReady = selectedChildrenCount > 0 && selectedObjective;

  const handleContinue = () => {
    if (isReady) {
      navigate('/create-story-titles'); // Direct to step 3 (titles)
    }
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col items-center justify-center min-vh-[70vh] px-4 py-8">
      {/* Container principal de la phrase magique */}
      <div className="w-full max-w-2xl bg-card rounded-3xl p-8 md:p-12 shadow-sm border border-border/50 backdrop-blur-sm transition-all duration-500 hover:shadow-md">
        
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-medium leading-[1.4] md:leading-[1.4] text-center text-foreground/90">
          Laissons Calmi préparer une histoire avec{' '}
          
          {/* Bouton Personnages */}
          <button 
            onClick={() => setIsChildrenDrawerOpen(true)}
            className={`
              inline-flex items-center gap-1.5 px-3 md:px-4 py-1.5 md:py-2 rounded-2xl md:rounded-full 
              font-bold text-2xl md:text-4xl lg:text-5xl transition-all duration-300 transform hover:scale-[1.02] active:scale-95
              border-b-4 border-transparent
              ${selectedChildrenCount > 0 
                ? 'text-primary bg-primary/10 hover:bg-primary/15' 
                : 'text-muted-foreground bg-muted hover:bg-muted/80 border-dashed border-b-muted-foreground/30'}
            `}
          >
            {getSelectedChildrenText()}
            <ChevronDown className={`w-5 h-5 md:w-8 md:h-8 ${selectedChildrenCount > 0 ? 'text-primary' : 'text-muted-foreground'}`} />
          </button>
          
          {' '}pour créer un beau moment et{' '}
          
          {/* Bouton Objectif */}
          <button 
            onClick={() => setIsObjectiveDrawerOpen(true)}
            className={`
              inline-flex items-center gap-1.5 px-3 md:px-4 py-1.5 md:py-2 rounded-2xl md:rounded-full 
              font-bold text-2xl md:text-4xl lg:text-5xl transition-all duration-300 transform hover:scale-[1.02] active:scale-95
              border-b-4 border-transparent
              ${selectedObjective 
                ? 'text-indigo-500 bg-indigo-500/10 hover:bg-indigo-500/15' 
                : 'text-muted-foreground bg-muted hover:bg-muted/80 border-dashed border-b-muted-foreground/30'}
            `}
          >
            {getSelectedObjectiveText()}
            <ChevronDown className={`w-5 h-5 md:w-8 md:h-8 ${selectedObjective ? 'text-indigo-500' : 'text-muted-foreground'}`} />
          </button>
          .
        </h1>

        {/* Bouton de validation (apparaît en douceur si prêt) */}
        <div className={`mt-12 flex justify-center transition-all duration-700 ease-out transform ${isReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'}`}>
          <Button 
            size="lg" 
            onClick={handleContinue}
            className="rounded-full px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all group"
          >
            <Sparkles className="w-5 h-5 mr-2 text-yellow-300 group-hover:rotate-12 transition-transform" />
            Création des 3 titres
          </Button>
        </div>
      </div>

      <MagicChildrenDrawer 
        open={isChildrenDrawerOpen}
        onOpenChange={setIsChildrenDrawerOpen}
        children={childrenList}
        selectedChildrenIds={selectedChildrenIds}
        onToggleChild={(id) => {
          const newSelection = selectedChildrenIds.includes(id)
            ? selectedChildrenIds.filter(cId => cId !== id)
            : [...selectedChildrenIds, id];
          updateSelectedChildren(newSelection);
        }}
      />

      <MagicObjectiveDrawer
        open={isObjectiveDrawerOpen}
        onOpenChange={setIsObjectiveDrawerOpen}
        objectives={objectives}
        selectedObjective={selectedObjective}
        onSelectObjective={updateSelectedObjective}
      />
    </div>
  );
};

export default MagicStoryCreator;
