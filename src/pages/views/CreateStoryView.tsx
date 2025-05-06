
import React from "react";
import StoryForm from "@/components/StoryForm";
import type { StoryFormData } from "@/components/story/StoryFormTypes";
import type { Story } from "@/types/story";
import type { Child } from "@/types/child";

interface CreateStoryViewProps {
  onSubmit: (formData: StoryFormData) => Promise<string>;
  children: Child[];
  onCreateChild: (child: Omit<Child, "id">) => void;
  onStoryCreated: (story: Story) => void;
}

export const CreateStoryView: React.FC<CreateStoryViewProps> = ({
  onSubmit,
  children,
  onCreateChild,
  onStoryCreated,
}) => {
  console.log('[CreateStoryView] Rendering with', {
    childrenCount: children?.length || 0,
    onSubmitDefined: !!onSubmit,
    onCreateChildDefined: !!onCreateChild,
    onStoryCreatedDefined: !!onStoryCreated
  });
  
  return (
    <div className="w-full max-w-4xl mx-auto animate-fade-in">
      <StoryForm
        onSubmit={onSubmit}
        children={children}
        onCreateChild={onCreateChild}
        onStoryCreated={onStoryCreated}
      />
    </div>
  );
};
