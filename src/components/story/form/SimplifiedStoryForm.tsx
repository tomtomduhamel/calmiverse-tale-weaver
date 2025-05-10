
import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StoryError } from "./StoryError";
import UnifiedChildSelector from "./UnifiedChildSelector";
import EnhancedObjectiveSelector from "./EnhancedObjectiveSelector";
import EnhancedSubmitButton from "./EnhancedSubmitButton";
import { useStoryForm } from "@/contexts/story-form/StoryFormContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import type { Child } from "@/types/child";
import type { Objective } from "@/types/story";
import type { StoryFormData } from "../StoryFormTypes";

interface SimplifiedStoryFormProps {
  children: Child[];
  onCreateChild: (child: Omit<Child, "id">) => Promise<string>;
  objectives: Objective[];
  className?: string;
  onSubmit: (formData: StoryFormData) => Promise<string>;
  onStoryCreated: (story: any) => void;
}

/**
 * Version simplifiée du formulaire d'histoire avec le sélecteur d'enfants unifié
 */
const SimplifiedStoryForm: React.FC<SimplifiedStoryFormProps> = ({
  children,
  onCreateChild,
  objectives,
  className,
  onSubmit,
  onStoryCreated
}) => {
  // Utilisation du hook useStoryForm qui est maintenant accessible grâce au Provider
  const { 
    state, 
    handleFormSubmit, 
    handleChildSelect
  } = useStoryForm();
  
  const { formError, selectedChildrenIds, selectedObjective } = state;
  const isMobile = useIsMobile();
  
  // Hauteur calculée pour éviter les problèmes de mise en page
  const scrollAreaHeight = isMobile 
    ? "h-[calc(100vh-250px)]" 
    : "h-[calc(100vh-180px)]";
  
  const handleCreateChildClick = () => {
    // Cette fonction ne prend pas de paramètres et sera passée à UnifiedChildSelector
    console.log("[SimplifiedStoryForm] Ouverture du formulaire de création d'enfant");
  };
  
  console.log("[SimplifiedStoryForm] Rendu avec state:", { 
    formError, 
    selectedChildrenIds, 
    selectedObjective, 
    childrenCount: children?.length || 0 
  });
  
  return (
    <div className={cn("flex flex-col h-full w-full", className)}>
      <ScrollArea className={scrollAreaHeight}>
        <form 
          onSubmit={handleFormSubmit}
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
            <StoryError error={formError} className="mb-4" />
          )}
          
          <UnifiedChildSelector 
            children={children}
            selectedChildrenIds={selectedChildrenIds}
            onChildSelect={handleChildSelect}
            onCreateChildClick={handleCreateChildClick}
            hasError={formError?.toLowerCase().includes('enfant') || formError?.toLowerCase().includes('child')}
            variant="simple"
          />

          <EnhancedObjectiveSelector objectives={objectives} />
          
          <div className="mt-6">
            <EnhancedSubmitButton />
          </div>
        </form>
      </ScrollArea>
    </div>
  );
};

export default SimplifiedStoryForm;
