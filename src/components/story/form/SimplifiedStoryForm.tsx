
import React, { useEffect } from "react";
import type { StoryFormProps } from "../StoryFormTypes";
import { StoryFormProvider } from "@/contexts/story-form/StoryFormContext";
import RobustStoryForm from "./RobustStoryForm";
import type { Objective } from "@/types/story";

interface SimplifiedStoryFormProps extends StoryFormProps {
  objectives: Objective[];
}

/**
 * Formulaire d'histoire simplifié avec gestionnaire d'état centralisé
 */
const SimplifiedStoryForm: React.FC<SimplifiedStoryFormProps> = ({
  onSubmit,
  children,
  onCreateChild,
  onStoryCreated,
  objectives
}) => {
  // Journaliser l'initialisation du composant
  useEffect(() => {
    console.log("[SimplifiedStoryForm] Initialisation avec", {
      childrenCount: children?.length || 0,
      objectivesCount: objectives?.length || 0,
      hasOnSubmit: !!onSubmit,
      hasOnCreateChild: !!onCreateChild,
      hasOnStoryCreated: !!onStoryCreated
    });
  }, [children, objectives, onSubmit, onCreateChild, onStoryCreated]);

  // Création d'une fonction wrapper pour garantir la compatibilité des types
  const handleCreateChild = onCreateChild ? () => onCreateChild : () => {
    console.warn("[SimplifiedStoryForm] Aucun gestionnaire onCreateChild fourni");
    return Promise.resolve("");
  };

  return (
    <StoryFormProvider 
      onSubmit={onSubmit}
      availableChildren={children || []}
      onStoryCreated={onStoryCreated}
    >
      <div className="story-form-container" data-testid="simplified-story-form">
        <RobustStoryForm
          children={children || []}
          onCreateChildClick={handleCreateChild}
          objectives={objectives}
        />
      </div>
    </StoryFormProvider>
  );
};

export default SimplifiedStoryForm;
