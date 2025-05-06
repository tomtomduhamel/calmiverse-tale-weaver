
import React from "react";
import type { StoryFormProps } from "./story/StoryFormTypes";
import StoryFormContainer from "./story/form/StoryFormContainer";

const StoryForm: React.FC<StoryFormProps> = ({
  onSubmit,
  children,
  onCreateChild,
  onStoryCreated,
}) => {
  console.log("[StoryForm] Rendering with", {
    childrenCount: children?.length || 0,
    hasOnSubmit: !!onSubmit,
    hasOnCreateChild: !!onCreateChild,
    hasOnStoryCreated: !!onStoryCreated
  });
  
  return (
    <StoryFormContainer
      onSubmit={onSubmit}
      children={children}
      onCreateChild={onCreateChild}
      onStoryCreated={onStoryCreated}
    />
  );
};

export default StoryForm;
