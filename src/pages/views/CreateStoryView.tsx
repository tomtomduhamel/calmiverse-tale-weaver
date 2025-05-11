
import React from "react";
import SimpleStoryFormWrapper from "@/components/story/SimpleStoryFormWrapper";
import type { Story } from "@/types/story";
import type { Child } from "@/types/child";

interface CreateStoryViewProps {
  onSubmit: (formData: { childrenIds: string[]; objective: string }) => Promise<string>;
  children: Child[];
  onCreateChild?: (child: Omit<Child, "id">) => Promise<string>;
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
  
  const handleCreateChild = onCreateChild ? () => {
    console.log('[CreateStoryView] Create child button clicked');
    // Cette fonction serait connectée à un modal de création d'enfant
  } : undefined;
  
  return (
    <div className="w-full max-w-4xl mx-auto animate-fade-in">
      <SimpleStoryFormWrapper
        onSubmit={onSubmit}
        children={children}
        onCreateChild={handleCreateChild}
        onStoryCreated={onStoryCreated}
      />
    </div>
  );
};
