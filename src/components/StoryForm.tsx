
import React from "react";
import type { StoryFormProps } from "./story/StoryFormTypes";
import { useStoryObjectives } from "@/hooks/useStoryObjectives";
import SimplifiedStoryForm from "./story/form/SimplifiedStoryForm";
import { Loader2 } from "lucide-react";
import { StoryFormProvider } from "@/contexts/story-form/StoryFormContext";

/**
 * Composant principal pour le formulaire d'histoire
 * Maintenant avec utilisation du sélecteur d'enfants unifié
 */
const StoryForm: React.FC<StoryFormProps> = ({
  onSubmit,
  children,
  onCreateChild,
  onStoryCreated,
}) => {
  // Charger les objectifs pour les histoires
  const { objectives, isLoading: objectivesLoading } = useStoryObjectives();
  
  // Objectifs par défaut si le chargement échoue
  const defaultObjectives = [
    { id: "sleep", label: "Aider à s'endormir", value: "sleep" },
    { id: "focus", label: "Se concentrer", value: "focus" },
    { id: "relax", label: "Se relaxer", value: "relax" },
    { id: "fun", label: "S'amuser", value: "fun" },
  ];
  
  console.log("[StoryForm] Rendu avec", {
    childrenCount: children?.length || 0,
    hasOnSubmit: !!onSubmit,
    hasOnCreateChild: !!onCreateChild,
    hasOnStoryCreated: !!onStoryCreated,
    objectivesLoaded: objectives?.length || 0
  });
  
  // Afficher un indicateur de chargement pendant le chargement des objectifs
  if (objectivesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
          <p className="text-muted-foreground">Chargement des objectifs...</p>
        </div>
      </div>
    );
  }
  
  return (
    <StoryFormProvider 
      onSubmit={onSubmit}
      availableChildren={children || []}
      onStoryCreated={onStoryCreated}
      key="story-form-provider"
    >
      <SimplifiedStoryForm
        onSubmit={onSubmit}
        children={children}
        onCreateChild={onCreateChild}
        onStoryCreated={onStoryCreated}
        objectives={objectives || defaultObjectives}
      />
    </StoryFormProvider>
  );
};

export default StoryForm;
