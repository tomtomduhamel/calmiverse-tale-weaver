
import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { default as StoryObjectives } from "../StoryObjectives";
import { StoryError } from "./StoryError";
import { StoryProgress } from "./StoryProgress";
import SimpleChildSelector from "./SimpleChildSelector";
import GenerateStoryButton from "./GenerateStoryButton";
import StoryFormHeader from "./StoryFormHeader";
import type { Child } from "@/types/child";
import { useIsMobile } from "@/hooks/use-mobile";

interface StoryFormContentProps {
  children: Child[];
  selectedChildrenIds: string[];
  onChildToggle: (childId: string) => void;
  onCreateChildClick: () => void;
  objective: string;
  setObjective: (objective: string) => void;
  objectives: any[];
  isSubmitting: boolean;
  progress: number;
  formError: string | null;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  onModeSwitch: () => void;
  isGenerateButtonDisabled?: boolean;
}

// Composant pour l'affichage du formulaire de création d'histoire optimisé
export const StoryFormContent = React.memo(({
  children,
  selectedChildrenIds,
  onChildToggle,
  onCreateChildClick,
  objective,
  setObjective,
  objectives,
  isSubmitting,
  progress,
  formError,
  onSubmit,
  onModeSwitch,
  isGenerateButtonDisabled = false,
}: StoryFormContentProps) => {
  const isMobile = useIsMobile();
  
  // Hauteur calculée pour éviter les problèmes de layout
  const scrollAreaHeight = isMobile ? "h-[calc(100vh-250px)]" : "h-[calc(100vh-180px)]";
  
  // Détection des erreurs ciblées
  const hasChildrenError = formError && (formError.toLowerCase().includes('child') || formError.toLowerCase().includes('enfant'));
  const hasObjectiveError = formError && (formError.toLowerCase().includes('objective') || formError.toLowerCase().includes('objectif'));
  
  // Gestionnaire de soumission direct
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[StoryFormContent] Formulaire soumis, appel de onSubmit");
    onSubmit(e).catch(err => {
      console.error("[StoryFormContent] Erreur lors de la soumission:", err);
    });
  };
  
  // Gestionnaire de clic sur le bouton
  const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    console.log("[StoryFormContent] Clic sur le bouton, soumission du formulaire");
    // Le type submit du bouton devrait automatiquement soumettre le formulaire
  };
  
  // Pour le débogage
  console.log("[StoryFormContent] Render:", {
    selectedChildrenIds,
    selectedChildCount: selectedChildrenIds?.length || 0,
    objective,
    isGenerateButtonDisabled,
    isSubmitting,
    hasChildrenError,
    hasObjectiveError
  });
  
  return (
    <div className="flex flex-col h-full w-full">
      <ScrollArea className={scrollAreaHeight}>
        <form 
          onSubmit={handleSubmit}
          className="space-y-6 animate-fade-in bg-white dark:bg-muted-dark p-4 sm:p-8 rounded-xl shadow-soft-lg transition-all hover:shadow-xl mx-auto max-w-[95%] sm:max-w-4xl mb-20"
          data-testid="story-form"
        >
          <StoryFormHeader onModeSwitch={onModeSwitch} />
          
          {formError && (
            <StoryError error={formError} className="animate-pulse" />
          )}
          
          <div className={`space-y-4 ${hasChildrenError ? 'ring-2 ring-destructive/20 rounded-lg p-4' : ''}`}>
            <SimpleChildSelector
              children={children}
              selectedChildrenIds={selectedChildrenIds}
              onChildSelect={onChildToggle}
              onCreateChildClick={onCreateChildClick}
              hasError={hasChildrenError}
            />
          </div>

          <div className={`space-y-4 ${hasObjectiveError ? 'ring-2 ring-destructive/20 rounded-lg p-4' : ''}`}>
            <label className="text-secondary dark:text-white text-base sm:text-lg font-medium">
              Je souhaite créer un moment de lecture qui va...
            </label>
            <StoryObjectives
              objectives={objectives}
              selectedObjective={objective}
              onObjectiveSelect={setObjective}
              hasError={hasObjectiveError}
            />
          </div>

          {isSubmitting && <StoryProgress progress={progress} isSubmitting={isSubmitting} />}
          
          <div className="mt-6">
            <GenerateStoryButton 
              disabled={isGenerateButtonDisabled}
              onClick={handleButtonClick}
              data-testid="generate-story-button-container"
            />
          </div>
        </form>
      </ScrollArea>
    </div>
  );
}); 

StoryFormContent.displayName = "StoryFormContent";
