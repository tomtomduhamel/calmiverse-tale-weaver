
import React from "react";
import StoryFormV2Wrapper from "@/components/StoryFormV2Wrapper";
import type { Story } from "@/types/story";
import type { Child } from "@/types/child";

interface CreateStoryViewProps {
  onSubmit: (formData: { childrenIds: string[]; objective: string }) => Promise<string>;
  children: Child[];
  onCreateChild: (child: Omit<Child, "id">) => Promise<string>;
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
      <StoryFormV2Wrapper
        onSubmit={onSubmit}
        children={children}
        onCreateChild={onCreateChild}
        onStoryCreated={onStoryCreated}
      />
    </div>
  );
};
