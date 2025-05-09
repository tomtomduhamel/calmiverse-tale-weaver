
import React from "react";
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
  console.log("[SimplifiedStoryForm] Rendering with", {
    childrenCount: children?.length || 0,
    objectivesCount: objectives?.length || 0,
    hasOnSubmit: !!onSubmit,
    hasOnCreateChild: !!onCreateChild,
    hasOnStoryCreated: !!onStoryCreated
  });

  // Création d'une fonction wrapper pour garantir la compatibilité des types
  const handleCreateChild = onCreateChild ? () => onCreateChild : () => {
    console.warn("No onCreateChild handler provided");
    return Promise.resolve("");
  };

  return (
    <StoryFormProvider 
      onSubmit={onSubmit}
      availableChildren={children || []}
      onStoryCreated={onStoryCreated}
    >
      <RobustStoryForm
        children={children || []}
        onCreateChildClick={handleCreateChild}
        objectives={objectives}
      />
    </StoryFormProvider>
  );
};

export default SimplifiedStoryForm;
