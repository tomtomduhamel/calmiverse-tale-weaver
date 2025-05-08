
import React from "react";
import type { StoryFormProps } from "./story/StoryFormTypes";
import { useStoryObjectives } from "@/hooks/useStoryObjectives";
import SimplifiedStoryForm from "./story/form/SimplifiedStoryForm";

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
  
  return (
    <SimplifiedStoryForm
      onSubmit={onSubmit}
      children={children}
      onCreateChild={onCreateChild}
      onStoryCreated={onStoryCreated}
      objectives={objectives || defaultObjectives}
    />
  );
};

export default StoryForm;
