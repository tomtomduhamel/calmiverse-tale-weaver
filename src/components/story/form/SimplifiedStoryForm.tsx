
import React from "react";
import type { StoryFormProps } from "../StoryFormTypes";
import { StoryFormProvider } from "@/contexts/StoryFormContext";
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

  return (
    <StoryFormProvider 
      onSubmit={onSubmit}
      availableChildren={children || []}
      onStoryCreated={onStoryCreated}
    >
      <RobustStoryForm
        children={children || []}
        onCreateChildClick={onCreateChild || (() => {})}
        objectives={objectives}
      />
    </StoryFormProvider>
  );
};

export default SimplifiedStoryForm;
