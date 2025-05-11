
import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StoryError } from "./StoryError";
import DirectChildSelector from "./DirectChildSelector";
import DirectObjectiveSelector from "./DirectObjectiveSelector";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Child } from "@/types/child";
import type { Objective } from "@/types/story";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles } from "lucide-react";

interface DirectStoryFormProps {
  children: Child[];
  onCreateChild: (child: Omit<Child, "id">) => Promise<string>;
  objectives: Objective[];
  selectedChildrenIds: string[];
  selectedObjective: string;
  isSubmitting: boolean;
  formError: string | null;
  onChildSelect: (childId: string) => void;
  onObjectiveSelect: (objective: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

/**
 * Formulaire d'histoire simplifié avec gestion d'état directe
 * Pour résoudre les problèmes de synchronisation et de contexte
 */
const DirectStoryForm: React.FC<DirectStoryFormProps> = ({
  children,
  onCreateChild,
  objectives,
  selectedChildrenIds,
  selectedObjective,
  isSubmitting,
  formError,
  onChildSelect,
  onObjectiveSelect,
  onSubmit
}) => {
  const isMobile = useIsMobile();
  
  // Hauteur calculée pour éviter les problèmes de mise en page
  const scrollAreaHeight = isMobile ? "h-[calc(100vh-250px)]" : "h-[calc(100vh-180px)]";
  
  // Déterminer si certains champs ont des erreurs
  const hasChildrenError = formError?.toLowerCase().includes('enfant');
  const hasObjectiveError = formError?.toLowerCase().includes('objectif');
  
  // Déterminer si le bouton est désactivé
  const isButtonDisabled = isSubmitting || selectedChildrenIds.length === 0 || !selectedObjective;
  
  console.log("[DirectStoryForm] Rendu avec", {
    childrenCount: children?.length || 0,
    selectedChildrenIds,
    selectedChildrenCount: selectedChildrenIds.length,
    selectedObjective,
    isSubmitting,
    formError,
    isButtonDisabled
  });
  
  // Gestionnaire pour l'ouverture du formulaire de création d'enfant
  const handleCreateChildClick = () => {
    console.log("[DirectStoryForm] Demande d'ouverture du formulaire de création d'enfant");
    // Cette fonctionnalité serait implémentée dans un composant spécifique
  };
  
  return (
    <div className="flex flex-col h-full w-full">
      <ScrollArea className={scrollAreaHeight}>
        <form 
          onSubmit={onSubmit}
          className="space-y-6 animate-fade-in bg-white dark:bg-muted-dark p-4 sm:p-8 rounded-xl shadow-soft-lg transition-all hover:shadow-xl mx-auto max-w-[95%] sm:max-w-4xl mb-20"
          data-testid="story-form"
          data-form-valid={selectedChildrenIds.length > 0 && !!selectedObjective ? "true" : "false"}
        >
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-primary">Créer une nouvelle histoire</h1>
            <p className="text-muted-foreground">
              Personnalisez une histoire magique pour un moment de lecture unique
            </p>
          </div>
          
          {formError && (
            <StoryError error={formError} className="mb-4 animate-pulse" />
          )}
          
          <DirectChildSelector 
            children={children}
            selectedChildrenIds={selectedChildrenIds}
            onChildSelect={onChildSelect}
            onCreateChildClick={handleCreateChildClick}
            hasError={hasChildrenError}
          />

          <DirectObjectiveSelector 
            objectives={objectives} 
            selectedObjective={selectedObjective}
            onObjectiveSelect={onObjectiveSelect}
            hasError={hasObjectiveError}
          />
          
          <div className="mt-6">
            <Button
              type="submit"
              className="w-full sm:w-auto sm:px-8 relative overflow-hidden transition-all"
              size="lg"
              disabled={isButtonDisabled}
              data-testid="generate-story-button"
              data-children-selected={selectedChildrenIds.length > 0 ? "true" : "false"}
              data-objective-selected={selectedObjective ? "true" : "false"}
              data-is-submitting={isSubmitting ? "true" : "false"}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Création en cours...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Générer une histoire
                </>
              )}
            </Button>
          </div>
        </form>
      </ScrollArea>
    </div>
  );
};

export default DirectStoryForm;
